from flask import Flask, jsonify
import subprocess

app = Flask(__name__)

@app.route("/start_eeg")
def start_eeg():
    subprocess.Popen(["python", "emo3.py"])
    return jsonify({"status": "EEG recording started"})

if __name__ == "__main__":
    app.run(debug=True)
