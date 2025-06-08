from flask import Flask, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import time
import threading
import random

app = Flask(__name__)
CORS(app)

# Global storage for latest data
latest = {
    "timestamp": None,
    "alpha": 0.0,
    "beta": 0.0,
    "theta": 0.0,
    "alpha_apen": 0.0,
    "beta_apen": 0.0,
    "theta_apen": 0.0
}

# Store last 10 readings
readings_history = []

def compute_apen(U, m=2, r=None):
    U = np.array(U)
    N = len(U)
    if r is None:
        r = 0.2 * np.std(U)

    def _phi(m):
        x = np.array([U[i:i + m] for i in range(N - m + 1)])
        C = []
        for xi in x:
            dist = np.max(np.abs(x - xi), axis=1)
            C.append(np.sum(dist <= r))
        return np.sum(np.log(C)) / (N - m + 1)

    return abs(_phi(m) - _phi(m + 1))

def generate_mock_data():
    global latest, readings_history
    
    # Base values for different cognitive states
    base_values = {
        "calm": {
            "alpha": 40.0,
            "beta": 20.0,
            "theta": 15.0
        },
        "focused": {
            "alpha": 30.0,
            "beta": 35.0,
            "theta": 10.0
        },
        "stressed": {
            "alpha": 20.0,
            "beta": 40.0,
            "theta": 25.0
        }
    }
    
    # Randomly select a cognitive state
    state = random.choice(["calm", "focused", "stressed"])
    base = base_values[state]
    
    # Add some random variation
    alpha = base["alpha"] + random.uniform(-5, 5)
    beta = base["beta"] + random.uniform(-5, 5)
    theta = base["theta"] + random.uniform(-5, 5)
    
    # Ensure values are positive
    alpha = max(0, alpha)
    beta = max(0, beta)
    theta = max(0, theta)
    
    # Calculate APEN values (simplified)
    alpha_apen = compute_apen([alpha + random.uniform(-2, 2) for _ in range(20)])
    beta_apen = compute_apen([beta + random.uniform(-2, 2) for _ in range(20)])
    theta_apen = compute_apen([theta + random.uniform(-2, 2) for _ in range(20)])
    
    # Update latest values
    latest = {
        "timestamp": datetime.now().isoformat(),
        "alpha": alpha,
        "beta": beta,
        "theta": theta,
        "alpha_apen": alpha_apen,
        "beta_apen": beta_apen,
        "theta_apen": theta_apen
    }
    
    # Add to history
    readings_history.append(latest.copy())
    if len(readings_history) > 10:
        readings_history.pop(0)

def mock_data_thread():
    while True:
        generate_mock_data()
        time.sleep(1)  # Generate new data every second

# Start the mock data generation thread
threading.Thread(target=mock_data_thread, daemon=True).start()

@app.route("/api/data")
def get_data():
    return jsonify(readings_history)

if __name__ == "__main__":
    app.run(port=5000, debug=True) 