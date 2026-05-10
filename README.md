# Hybrid Battery Digital Twin for Real-Time Battery Health Monitoring
Overview
This project presents a Hybrid Battery Digital Twin framework for real-time monitoring and estimation of battery parameters such as State of Charge (SOC), State of Health (SOH), and temperature. The system combines physics-based battery modeling with machine learning techniques and integrates IoT-based real-time data acquisition using ESP32.
The project is implemented using MATLAB, Simulink, ESP32, and a Flask-based web dashboard for Battery Management System (BMS) visualization.

Features


Real-time battery monitoring using ESP32


Hybrid digital twin architecture


Physics-based electro-thermal battery model


Machine learning-based correction model


SOC, SOH, and temperature estimation


Real-time MATLAB–Simulink integration


Flask-based BMS dashboard


Safety warning and threshold logic


Simulation and real-time operating modes



System Architecture
Battery → Sensors → ESP32 → WiFi → MATLAB → Simulink        → Hybrid Digital Twin → Flask API → Web Dashboard

Technologies Used
Hardware


ESP32


ACS712 Current Sensor


Voltage Divider Circuit


IR Sensors


L298N Motor Driver


Li-ion Battery


Software


MATLAB


Simulink


Arduino IDE


Python Flask


HTML/CSS/JavaScript



Machine Learning Approach
The project uses a lightweight neural network regression model to estimate battery parameters.
Inputs


Voltage


Current


Temperature


Outputs


SOC


Temperature correction


Training Parameters
ParameterValueEpochs200Learning Rate0.001OptimizerAdamLoss FunctionMean Squared ErrorHidden Layers3ActivationReLU

Physics-Based Model
The physics model includes:


Coulomb counting for SOC estimation


Equivalent Circuit Model (ECM)


Thermal modeling


SOH degradation estimation



Hybrid Fusion
The final battery estimation combines:
Hybrid Output = Physics Model + ML Correction
Adaptive weighting is used to improve robustness and reduce estimation error.

Real-Time Data Flow


ESP32 reads voltage and current


Data sent to MATLAB via TCP/IP


MATLAB updates Simulink in real time


Simulink computes SOC, SOH, TEMP


Flask dashboard displays live results



Dashboard Features


SOC gauge


SOH indicator


Temperature visualization


Real-time trend graphs


Safety alerts and warnings



Safety Logic
ConditionActionSOC < 30%WarningSOC < 20%Speed ReductionSOC < 10%Robot StopTemp > 45°CEmergency Shutdown

Project Structure
/project│├── matlab/│   ├── realtime_code.m│   ├── simulation_code.m│   └── Simulink Model.slx│├── esp32/│   └── esp32_firmware.ino│├── flask_dashboard/│   ├── app.py│   ├── templates/│   └── static/│├── dataset/│   └── battery_dataset.csv│└── README.md

Applications


Electric Vehicles


Smart Battery Systems


Robotics


Energy Storage Systems


Industrial Monitoring



Future Scope


LSTM-based prediction


Cloud deployment


Mobile application


Multi-cell battery packs


AI-based anomaly detection



Conclusion
This project demonstrates a scalable and intelligent hybrid battery digital twin capable of operating in both simulation and real-time environments. By combining IoT, machine learning, physics-based modeling, and web technologies, the system provides efficient and reliable battery monitoring for modern energy applications.

Authors


Hasini Bolloji


Karthikeya Busupalli


Ponnoju Sreekar Kumar


Department of Electronics & Instrumentation Engineering
VNR Vignana Jyothi Institute of Engineering & Technology

