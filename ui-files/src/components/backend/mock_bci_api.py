from flask import Flask, jsonify
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# Generate a mock readings_history list with 10 readings
def generate_mock_readings():
    now = datetime.now()
    readings = []
    for i in range(10):
        reading = {
            "timestamp": (now - timedelta(seconds=3 - i * 0.3)).isoformat(),
            "alpha": round(random.uniform(0.2, 0.8), 4),
            "beta": round(random.uniform(0.1, 0.5), 4),
            "theta": round(random.uniform(0.1, 0.5), 4),
            "alpha_apen": round(random.uniform(0.1, 0.5), 4),
            "beta_apen": round(random.uniform(0.1, 0.5), 4),
            "theta_apen": round(random.uniform(0.1, 0.5), 4)
        }
        readings.append(reading)
    return readings

@app.route("/api/data")
def get_data():
    return jsonify(generate_mock_readings())

if __name__ == "__main__":
    app.run(port=5000)