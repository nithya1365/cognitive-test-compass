# 🧠 BCI-Based Cognitive Load Adaptive Testing System

## Overview

This project is a complete pipeline that uses a Brain-Computer Interface (BCI) to measure cognitive load in real time and adapt test difficulty based on the user’s mental state. It integrates signal processing, machine learning, and UI feedback to deliver a responsive testing system that personalizes question difficulty using EEG brainwave data.

---

## 🧩 Workflow

### 1. **Raw Data Collection**

* EEG signals (alpha, beta, theta waves) are captured using a BCI headset.
* A **sample test** is conducted, during which raw EEG data is stored in a `.csv` file.
* Simultaneously, **Approximate Entropy (ApEn)** is computed for alpha, beta, and theta waves **in real time** and stored alongside the raw EEG values in the same CSV.

### 2. **Training the Cognitive Load Model**

* A **Support Vector Machine (SVM)** classifier is trained on the generated CSV.
* Features used for training include:

  * Cognitive Index (CI) computed from current alpha values using:

    ```
    CI_Alpha = ((baseline_alpha - current_alpha) / baseline_alpha) * 100
    ```
  * ApEn values for alpha, beta, and theta waves.
* Labels (0 = Low Load, 1 = High Load) are derived based on a **median split** of the CI\_Alpha values.
* The SVM is evaluated using **10-fold cross-validation** for robustness.

### 3. **Calibration**

* A 1-minute **calibration period** is conducted before the actual test.
* The average alpha value during this period is used as the **baseline** for CI calculation in subsequent phases.

### 4. **Real-Time Test Phase**

* During the actual test, EEG data is continuously streamed.
* For each 3-second segment, the system:

  * Computes the current CI\_Alpha and ApEn values.
  * Inputs these values into the trained SVM model.
  * Receives a prediction (`0` for low, `1` for high cognitive load).
  * Sends this prediction to the UI in **real time**.

### 5. **Dynamic Question Difficulty**

* For each question:

  * Averages the 0s and 1s predicted during the time the question was answered.
  * Classifies cognitive load as:

    * **Low** (avg < 0.4)
    * **Medium** (0.4–0.6)
    * **High** (avg > 0.6)
  * Based on the load, adjusts the next question’s difficulty:

    * High load → easier question
    * Low load → harder question

### 6. **Result Analysis**

* After the test:

  * A **graphical report** shows how cognitive load changed over time.
  * Helps in understanding the user’s performance and mental fatigue throughout the test.

---

## 🛠️ Tech Stack

| Component       | Technology                        |
| --------------- | --------------------------------- |
| Data Collection | BCI Headset, Python (CSV logging) |
| Signal Features | Approximate Entropy (ApEn)        |
| ML Model        | Scikit-learn (SVM Classifier)     |
| Real-Time Logic | Flask API, Numpy, Pandas          |
| Frontend        | React + Chart.js (for plotting)   |
| Visualization   | Matplotlib, Seaborn               |

---

## 🧪 Key Features

* EEG-based **real-time cognitive load estimation**
* **Approximate Entropy** and **Cognitive Index** as input features
* **Adaptive test logic** based on brain state
* **Dynamic question selection** for personalized learning
* Clear **result visualization** with cognitive load trends

---

## 📁 Output Files

* `trained_model.pkl`: SVM model saved after training
* `model_output.csv`: Merged CSV with all predictions and features
* `graph.png`: CI\_Alpha over segments (training phase)
* `graph_svm.png`: Real-time predictions over test duration
* `confusion_matrix.png`: Classification performance heatmap

---


