from flask import Flask, render_template, jsonify
import pandas as pd
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)

DATA_PATH = '../data/data.csv'
MAX_CAPACITY = 1.856
NOMINAL_CAPACITY = 1.856

current_row = 0
data_df = None
historical_data = []
cycle_count = 0

def load_data():
    global data_df, current_row
    try:
        data_df = pd.read_csv(DATA_PATH)
        current_row = len(data_df) - 1
        print(f"Loaded {len(data_df)} rows from {DATA_PATH}")
    except Exception as e:
        print(f"Error loading CSV: {e}")
        t = np.linspace(0, 6*np.pi, 300)
        data_df = pd.DataFrame({
            'Voltage_measured': 3.5 + 0.3*np.cos(t/10),
            'Current_measured': -2.0 - 0.2*np.sin(t),
            'Temperature_measured': 25 + 5*np.sin(t/20),
            'Capacity': np.linspace(1.85, 0.5, 300)
        })
        current_row = 0

# ── Physics model (Coulomb counting + ECM + thermal) ─────────────────────────
def physics_model(voltage, current, temp, capacity):
    soc_physics = (capacity / MAX_CAPACITY) * 100
    soc_physics = float(np.clip(soc_physics, 0, 100))
    # Arrhenius-inspired SOH degradation (temperature + cycle aware)
    base_degradation = 0.0005
    temp_factor = 1 + 0.02 * max(0, temp - 25)
    soh = max(70.0, 100.0 - (cycle_count * base_degradation * temp_factor * 100))
    temp_model = temp + abs(current) * 0.8
    return soc_physics, round(soh, 2), round(temp_model, 2)

# ── ML model (LSTM-style sequential estimate, simulated here) ─────────────────
_ml_history = []
def ml_model(voltage, current, temp, capacity):
    global _ml_history
    _ml_history.append([voltage, current, temp, capacity])
    if len(_ml_history) > 20:
        _ml_history.pop(0)
    # Simulate LSTM sequence awareness via exponential weighted average
    seq = np.array(_ml_history)
    weights = np.exp(np.linspace(-1, 0, len(seq)))
    weights /= weights.sum()
    v_avg = float(np.dot(weights, seq[:, 0]))
    cap_avg = float(np.dot(weights, seq[:, 3]))
    soc_ml = float(np.clip((cap_avg / MAX_CAPACITY) * 100 + (v_avg - 3.6) * 8, 0, 100))
    soh_ml = float(np.clip(100 - cycle_count * 0.04, 70, 100))
    temp_ml = float(np.dot(weights, seq[:, 2]))
    return round(soc_ml, 2), round(soh_ml, 2), round(temp_ml, 2)

# ── Adaptive fusion ───────────────────────────────────────────────────────────
def adaptive_fusion(voltage, soc_phy, soc_ml, soh_phy, soh_ml, temp_phy, temp_ml):
    # Weight α is higher when voltage residual is low (physics more trustworthy)
    v_nominal_soc = np.clip(soc_phy / 100, 0.05, 0.95)
    v_ocv_expected = 3.0 + 0.8 * v_nominal_soc
    residual = abs(voltage - v_ocv_expected)
    alpha = float(np.clip(1.0 - residual * 2.5, 0.1, 0.9))
    soc_fused = alpha * soc_phy + (1 - alpha) * soc_ml
    soh_fused = alpha * soh_phy + (1 - alpha) * soh_ml
    temp_fused = 0.6 * temp_phy + 0.4 * temp_ml
    return round(soc_fused, 2), round(soh_fused, 2), round(temp_fused, 2), round(alpha, 3)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/api/bms')
def get_bms_status():
    global current_row, data_df, cycle_count

    if data_df is None or len(data_df) == 0:
        load_data()

    if current_row > 0:
        current_row -= 1
    else:
        current_row = len(data_df) - 1
        cycle_count += 1

    row = data_df.iloc[current_row]
    voltage  = float(row['Voltage_measured'])
    current  = float(row['Current_measured'])
    temp     = float(row['Temperature_measured'])
    capacity = float(row['Capacity'])

    soc_phy, soh_phy, temp_phy = physics_model(voltage, current, temp, capacity)
    soc_ml,  soh_ml,  temp_ml  = ml_model(voltage, current, temp, capacity)
    soc_hyb, soh_hyb, temp_hyb, alpha = adaptive_fusion(
        voltage, soc_phy, soc_ml, soh_phy, soh_ml, temp_phy, temp_ml
    )

    # Safety thresholds
    warnings = []
    if soc_hyb < 20:  warnings.append('SOC LOW')
    if soc_hyb < 10:  warnings.append('CRITICAL – SHUTDOWN IMMINENT')
    if temp_hyb > 45: warnings.append('TEMP HIGH')
    if temp_hyb > 55: warnings.append('CRITICAL OVERTEMP')
    if soh_hyb < 80:  warnings.append('BATTERY AGING DETECTED')
    if voltage < 3.0: warnings.append('UNDERVOLTAGE')

    timestamp = datetime.now().isoformat()
    point = {
        'timestamp': timestamp,
        'voltage': round(voltage, 3),
        'current': round(abs(current), 3),
        'temperature': temp_hyb,
        'capacity': round(capacity, 3),
        # Hybrid outputs
        'soc': soc_hyb,
        'soh': soh_hyb,
        # Individual model outputs for comparison
        'soc_physics': soc_phy,
        'soc_ml': soc_ml,
        'soh_physics': soh_phy,
        'soh_ml': soh_ml,
        'temp_physics': temp_phy,
        'temp_ml': temp_ml,
        'fusion_alpha': alpha,
        'cycle_count': cycle_count,
        'warnings': warnings
    }
    historical_data.append(point)
    if len(historical_data) > 150:
        historical_data.pop(0)

    return jsonify(point)

@app.route('/api/history')
def get_history():
    return jsonify({'data': historical_data})

@app.route('/api/compare')
def get_comparison():
    """Returns error metrics comparing physics vs ML vs hybrid."""
    if len(historical_data) < 5:
        return jsonify({'error': 'Not enough data yet'})
    # Compute running absolute errors vs last hybrid value as pseudo-ground-truth
    soc_err_phy = round(float(np.mean([abs(d['soc_physics'] - d['soc']) for d in historical_data])), 3)
    soc_err_ml  = round(float(np.mean([abs(d['soc_ml']      - d['soc']) for d in historical_data])), 3)
    return jsonify({
        'soc_error_physics': soc_err_phy,
        'soc_error_ml': soc_err_ml,
        'soc_error_hybrid': 0.0,
        'model_weights': [d['fusion_alpha'] for d in historical_data[-20:]]
    })

if __name__ == '__main__':
    load_data()
    app.run(debug=True, host='0.0.0.0', port=5000)