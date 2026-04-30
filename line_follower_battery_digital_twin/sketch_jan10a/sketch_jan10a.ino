#include <WiFi.h>

/* ================= WIFI CONFIG ================= */
const char* ssid = "yes";
const char* password = "abcd1234";

/* MATLAB PC IP */
const char* serverIP = "10.175.123.31";   // 🔴 CHANGE THIS
const int serverPort = 8081;

WiFiClient client;

/* ================= LINE FOLLOWER PINS ================= */
const int IR_Left  = 32;
const int IR_Right = 33;

const int ENA = 25;
const int IN1 = 26;
const int IN2 = 27;

const int ENB = 14;
const int IN3 = 12;
const int IN4 = 13;

/* ================= SENSOR PINS ================= */
const int voltagePin = 34;   // Voltage divider
const int currentPin = 35;   // ACS712 output

/* ================= ADC SETTINGS ================= */
const float ADC_REF = 3.3;
const int ADC_RES = 4095;

/* Voltage divider (10k & 10k) */
const float VOLTAGE_FACTOR = 2.0;

/* ACS712 (5A version) */
const float ACS_OFFSET = 2.5;
const float ACS_SENSITIVITY = 0.185;

/* ================= TIMING ================= */
unsigned long lastSend = 0;
const unsigned long sendInterval = 1000;  // 1 second

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);

  pinMode(IR_Left, INPUT);
  pinMode(IR_Right, INPUT);

  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  /* WiFi Connection */
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

/* ================= MOTOR FUNCTIONS ================= */
void moveForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 150);
  analogWrite(ENB, 150);
}

void turnLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 120);
  analogWrite(ENB, 150);
}

void turnRight() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, 150);
  analogWrite(ENB, 120);
}

void stopRobot() {
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

/* ================= LOOP ================= */
void loop() {

  /* ---------- LINE FOLLOWER ---------- */
  int leftSensor  = digitalRead(IR_Left);
  int rightSensor = digitalRead(IR_Right);

  if (leftSensor == LOW && rightSensor == LOW) {
    moveForward();
  }
  else if (leftSensor == HIGH && rightSensor == LOW) {
    turnLeft();
  }
  else if (leftSensor == LOW && rightSensor == HIGH) {
    turnRight();
  }
  else {
    stopRobot();
  }

  /* ---------- CONNECT TO MATLAB ---------- */
  if (!client.connected()) {
    Serial.println("🔄 Connecting to MATLAB...");
    if (client.connect(serverIP, serverPort)) {
      Serial.println("✅ Connected to MATLAB");
    } else {
      Serial.println("❌ Connection failed");
    }
  }

  /* ---------- SEND DATA ---------- */
  unsigned long currentMillis = millis();

  if (currentMillis - lastSend >= sendInterval && client.connected()) {

    lastSend = currentMillis;

    /* 🔋 Voltage Measurement */
    int adcV = analogRead(voltagePin);
    float Vadc = adcV * (ADC_REF / ADC_RES);
    float Vbattery = Vadc * VOLTAGE_FACTOR;

    /* ⚡ Current Measurement (ACS712) */
    int adcI = analogRead(currentPin);
    float Vcurrent = adcI * (ADC_REF / ADC_RES);
    float Current = (Vcurrent - ACS_OFFSET) / ACS_SENSITIVITY;

    /* 📡 Send to MATLAB */
    client.print("V=");
    client.print(Vbattery, 2);
    client.print("&I=");
    client.println(Current, 2);

    /* Debug Output */
    Serial.print("📤 Sent → V=");
    Serial.print(Vbattery, 2);
    Serial.print("V  I=");
    Serial.print(Current, 2);
    Serial.println("A");
  }
}