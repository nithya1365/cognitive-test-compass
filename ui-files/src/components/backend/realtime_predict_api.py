from flask import Flask, jsonify, request, send_file
import joblib
import numpy as np
import pandas as pd
import requests
import threading
import time
import csv
from datetime import datetime
import os
from threading import Lock

app = Flask(__name__)

# Load the trained SVM model
model = joblib.load("trained_model.pkl")

# === Load Baseline Values from bci_calm.csv (first minute) ===
BCI_CSV_PATH = os.path.join(os.path.dirname(__file__), 'bci_calm.csv')
baseline_alpha = None

def load_baseline():
    global baseline_alpha
    df = pd.read_csv(BCI_CSV_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    start_time = df['timestamp'].min()
    baseline_end = start_time + pd.Timedelta(seconds=60)
    baseline_df = df[df['timestamp'] <= baseline_end]
    baseline_alpha = baseline_df['alpha'].mean()
    print(baseline_alpha)

load_baseline()

# === CSV for Storing Predictions ===
PREDICTION_CSV = os.path.join(os.path.dirname(__file__), 'realtime_predictions.csv')
CSV_HEADER = ['timestamp', 'CI_Alpha', 'alpha_apen', 'beta_apen', 'theta_apen', 'prediction', 'label']

# Thread-safe recording flag and lock
data_lock = Lock()
recording = False

def write_csv_header():
    with open(PREDICTION_CSV, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADER)

# Ensure header exists at startup
if not os.path.exists(PREDICTION_CSV):
    write_csv_header()

# === Background Thread for Real-Time Prediction ===
def realtime_predict_loop():
    global recording
    while True:
        try:
            # Only record if recording is enabled
            with data_lock:
                is_recording = recording
            if not is_recording:
                time.sleep(0.5)
                continue
            # Fetch last 10 readings from bci_api (should be ~1s apart, so covers ~10s)
            resp = requests.get('http://localhost:5000/api/data', timeout=2)
            if resp.status_code != 200:
                time.sleep(0.5)
                continue
            data = resp.json()
            if not data or len(data) == 0:
                time.sleep(0.5)
                continue
            # Only keep readings from the last 3 seconds
            now = datetime.now()
            readings = []
            for entry in data:
                try:
                    ts = pd.to_datetime(entry.get('TIMESTAMP') or entry.get('timestamp'))
                    if (now - ts).total_seconds() <= 3:
                        readings.append(entry)
                except Exception:
                    continue
            if len(readings) == 0:
                time.sleep(0.5)
                continue
            # Compute averages for the 3s epoch
            alpha_vals = [float(r.get('ALPHA', r.get('alpha', 0))) for r in readings]
            alpha_apen_vals = [float(r.get('ALPHA_APEN', r.get('alpha_apen', 0))) for r in readings]
            beta_apen_vals = [float(r.get('BETA_APEN', r.get('beta_apen', 0))) for r in readings]
            theta_apen_vals = [float(r.get('THETA_APEN', r.get('theta_apen', 0))) for r in readings]
            avg_alpha = np.mean(alpha_vals)
            avg_alpha_apen = np.mean(alpha_apen_vals)
            avg_beta_apen = np.mean(beta_apen_vals)
            avg_theta_apen = np.mean(theta_apen_vals)
            # Calculate CI_Alpha
            ci_alpha = ((baseline_alpha - avg_alpha) / baseline_alpha) * 100 if baseline_alpha else 0
            # Prepare input for model
            X = np.array([[ci_alpha]])
            pred = model.predict(X)[0]
            label = "High Load" if pred == 1 else "Low Load"
            # Use the latest timestamp in the 3s window
            latest_ts = max([r.get('TIMESTAMP', r.get('timestamp')) for r in readings])
            # Store in CSV
            with data_lock:
                with open(PREDICTION_CSV, 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([latest_ts, ci_alpha, avg_alpha_apen, avg_beta_apen, avg_theta_apen, int(pred), label])
        except Exception as e:
            print(f"Error in realtime prediction loop: {e}")
        time.sleep(0.5)

# Start background thread
t = threading.Thread(target=realtime_predict_loop, daemon=True)
t.start()

# Optionally, endpoint to get latest prediction
def get_latest_prediction():
    if not os.path.exists(PREDICTION_CSV):
        return None
    with open(PREDICTION_CSV, 'r') as f:
        rows = list(csv.reader(f))
        if len(rows) < 2:
            return None
        header = rows[0]
        last = rows[-1]
        return dict(zip(header, last))

@app.route('/latest_prediction', methods=['GET'])
def latest_prediction():
    pred = get_latest_prediction()
    if pred:
        return jsonify(pred)
    else:
        return jsonify({'error': 'No prediction yet'}), 404

# === New endpoints for recording control ===
@app.route('/start_recording', methods=['POST'])
def start_recording():
    global recording
    with data_lock:
        recording = True
    return jsonify({'status': 'recording started'})

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global recording
    with data_lock:
        recording = False
        # Clear the CSV except for the header
        write_csv_header()
    return jsonify({'status': 'recording stopped and CSV cleared'})

@app.route('/realtime_predictions.csv', methods=['GET'])
def serve_prediction_csv():
    return send_file(PREDICTION_CSV, mimetype='text/csv', as_attachment=False)

if __name__ == '__main__':
    app.run(port=6000,debug=True)