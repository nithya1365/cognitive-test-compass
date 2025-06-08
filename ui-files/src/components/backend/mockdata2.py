from flask import Flask, jsonify
from flask_cors import CORS  # Added CORS support
from datetime import datetime
import random
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# This will hold the latest reading in the same format as bci_api.py
latest = {
    "timestamp": None,
    "alpha": 0.0,
    "beta": 0.0,
    "theta": 0.0
}

# Store last 10 readings
readings_history = []

# Function to generate a single mock EEG reading
def generate_single_reading():
    return {
        "timestamp": datetime.now().isoformat(),
        "alpha": round(random.uniform(0.2, 0.8), 4),
        "beta": round(random.uniform(0.1, 0.5), 4),
        "theta": round(random.uniform(0.1, 0.5), 4)
    }

# Background thread function to update the reading every 100ms
def update_data_continuously():
    global latest, readings_history
    while True:
        latest = generate_single_reading()
        # Add to history
        readings_history.append(latest.copy())
        if len(readings_history) > 10:
            readings_history.pop(0)
        time.sleep(0.1)  # 100ms update interval

# GET endpoint to return the last 10 readings as JSON
@app.route("/api/data", methods=["GET"])
def get_data():
    return jsonify(readings_history)

if __name__ == "__main__":
    # Start the background thread
    thread = threading.Thread(target=update_data_continuously)
    thread.daemon = True
    thread.start()

    # Start the Flask app
    app.run(port=5000)
