from flask import Flask, jsonify
import joblib
import numpy as np
import pandas as pd
import requests
import threading
import time
import csv
from datetime import datetime
import os
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
# Load the trained SVM model
model = joblib.load("trained_model.pkl")

# === Load Baseline Values from bci_calm.csv (first minute) ===
BCI_CSV_PATH = os.path.join(os.path.dirname(__file__), 'bci_calm.csv')
baseline_alpha = None

# Global variable to store current cognitive load state
current_cognitive_state = {
    "load": "unknown",
    "confidence": 0.0,
    "last_update": None
}

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
if not os.path.exists(PREDICTION_CSV):
    with open(PREDICTION_CSV, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'CI_Alpha', 'alpha_apen', 'beta_apen', 'theta_apen', 'prediction', 'label', 'confidence'])

def get_latest_prediction():
    try:
        print("=== Getting Latest Prediction ===")
        if not os.path.exists(PREDICTION_CSV):
            print("Prediction CSV file does not exist")
            return None
        
        # Read the last line of the CSV file
        with open(PREDICTION_CSV, 'r') as f:
            lines = f.readlines()
            print(f"Total lines in CSV: {len(lines)}")
            if len(lines) <= 1:  # Only header or empty file
                print("CSV file is empty or only contains header")
                return None
            
            # Get the last line and parse it
            last_line = lines[-1].strip().split(',')
            print(f"Last line from CSV: {last_line}")
            if len(last_line) >= 6:  # Make sure we have enough columns
                result = {
                    'timestamp': last_line[0],
                    'prediction': int(last_line[5]),  # The prediction column (0 or 1)
                    'label': last_line[6],  # The label column
                    'confidence': float(last_line[7]) if len(last_line) > 7 else 0.0
                }
                print(f"Parsed prediction result: {result}")
                return result
            else:
                print(f"Invalid line format. Expected at least 6 columns, got {len(last_line)}")
    except Exception as e:
        print(f"Error reading latest prediction: {e}")
        return None
    return None

# === Background Thread for Real-Time Prediction ===
def realtime_predict_loop():
    while True:
        try:
            # Fetch last 10 readings from bci_api (should be ~1s apart, so covers ~10s)
            resp = requests.get('http://localhost:5000/api/data', timeout=2)
            if resp.status_code != 200:
                time.sleep(3)
                continue
            data = resp.json()
            if not data or len(data) == 0:
                time.sleep(3)
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
                time.sleep(3)
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
            
            # Calculate confidence based on signal stability
            signal_stability = 1.0 - (np.std(alpha_vals) / np.mean(alpha_vals)) if np.mean(alpha_vals) > 0 else 0
            confidence = min(max(signal_stability, 0), 1)  # Clamp between 0 and 1
            
            label = "High Load" if pred == 1 else "Low Load"
            
            # Update global cognitive state
            global current_cognitive_state
            current_cognitive_state = {
                "load": label,
                "confidence": confidence,
                "last_update": datetime.now().isoformat()
            }
            
            # Use the latest timestamp in the 3s window
            latest_ts = max([r.get('TIMESTAMP', r.get('timestamp')) for r in readings])
            
            # Store in CSV
            with open(PREDICTION_CSV, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([latest_ts, ci_alpha, avg_alpha_apen, avg_beta_apen, avg_theta_apen, int(pred), label, confidence])
        except Exception as e:
            print(f"Error in realtime prediction loop: {e}")
        time.sleep(3)

# Start background thread
t = threading.Thread(target=realtime_predict_loop, daemon=True)
t.start()

@app.route('/cognitive_state', methods=['GET'])
def get_cognitive_state():
    return jsonify(current_cognitive_state)

@app.route('/latest_prediction', methods=['GET'])
def latest_prediction():
    print("=== Latest Prediction Endpoint Called ===")
    pred = get_latest_prediction()
    print("Latest prediction data:", pred)
    if pred:
        print("Returning prediction:", pred)
        return jsonify(pred)
    else:
        print("No prediction available")
        return jsonify({'error': 'No prediction yet'}), 404

if __name__ == '__main__':
    app.run(port=6060,debug=True)