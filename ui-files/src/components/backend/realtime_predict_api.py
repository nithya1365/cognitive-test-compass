from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load the trained SVM model
model = joblib.load("trained_model.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    ci_alpha = data.get("CI_Alpha")
    alpha_apen = data.get("alpha_apen")
    beta_apen = data.get("beta_apen")
    theta_apen = data.get("theta_apen")

    # Validate all required fields
    if None in [ci_alpha, alpha_apen, beta_apen, theta_apen]:
        return jsonify({"error": "Missing one or more required fields: CI_Alpha, alpha_apen, beta_apen, theta_apen"}), 400

    try:
        # Create input array in the same order used during model training
        X = np.array([[ci_alpha, alpha_apen, beta_apen, theta_apen]])

        # Make prediction
        pred = model.predict(X)[0]
        label = "High Load" if pred == 1 else "Low Load"

        return jsonify({
            "prediction": int(pred),
            "label": label
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=6000, debug=True)
