from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load trained model and scaler
model = joblib.load("svm_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    alpha_apen = data.get("alpha_apen")
    beta_apen = data.get("beta_apen")
    theta_apen = data.get("theta_apen")

    # Validation
    if None in [alpha_apen, beta_apen, theta_apen]:
        return jsonify({"error": "Missing ApEn value(s)"}), 400

    # Convert to numpy array and reshape
    X = np.array([[alpha_apen, beta_apen, theta_apen]])
    X_scaled = scaler.transform(X)

    # Predict
    pred = model.predict(X_scaled)[0]
    label = "High Load" if pred == 1 else "Low Load"

    return jsonify({
        "prediction": int(pred),
        "label": label
    })

if __name__ == '__main__':
    app.run(port=6000, debug=True)
