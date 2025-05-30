# === Imports ===
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold, train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
import warnings
import os
import pickle
warnings.filterwarnings('ignore')

# === Setup Paths ===
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, 'bci_calm.csv')
print(f"Script directory: {current_dir}")
print(f"Loading data from: {file_path}")

if not os.path.exists(file_path):
    raise FileNotFoundError(f"CSV file not found at {file_path}")

# === Load Data ===
data = pd.read_csv(file_path)
data['timestamp'] = pd.to_datetime(data['timestamp'])

# === Baseline: First 1 Minute ===
start_time = data['timestamp'].min()
baseline_end = start_time + pd.Timedelta(seconds=60)
baseline_df = data[data['timestamp'] <= baseline_end]

baseline_alpha = baseline_df['alpha'].mean()
baseline_beta = baseline_df['beta'].mean()
baseline_theta = baseline_df['theta'].mean()

print(f"Baseline - Alpha: {baseline_alpha:.2f}, Beta: {baseline_beta:.2f}, Theta: {baseline_theta:.2f}")

# === Segment Data ===
data['Seconds'] = (data['timestamp'] - data['timestamp'].iloc[0]).dt.total_seconds()
segment_length = 3
data['Segment'] = (data['Seconds'] // segment_length).astype(int)

# === Compute Band Power Averages and CLI ===
def compute_ci(baseline, current):
    return ((baseline - current) / baseline) * 100

segmented = data.groupby('Segment')[['alpha', 'beta', 'theta']].mean().reset_index()
segmented['CI_Alpha'] = compute_ci(baseline_alpha, segmented['alpha'])
segmented['CI_Beta'] = compute_ci(baseline_beta, segmented['beta'])
segmented['CI_Theta'] = compute_ci(baseline_theta, segmented['theta'])

# Add ApEn features if available
apen_features = []
for apen_col in ['alpha_apen', 'beta_apen', 'theta_apen']:
    if apen_col in data.columns:
        segmented[apen_col] = data.groupby('Segment')[apen_col].mean().values
        apen_features.append(apen_col)

# === Labeling Based on Alpha CLI (Median Split) ===
median_alpha_cli = segmented['CI_Alpha'].median()
segmented['label'] = segmented['CI_Alpha'].apply(lambda x: 1 if x > median_alpha_cli else 0)

# === Prepare Features and Labels ===
feature_cols = ['CI_Alpha'] + apen_features
X = segmented[feature_cols].copy()
y = segmented['label']

# === Handle Missing/Infinite Values ===
X.replace([np.inf, -np.inf], np.nan, inplace=True)
X = SimpleImputer(strategy='mean').fit_transform(X)

# === Normalize Features ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === Plot Alpha CLI ===
plt.figure(figsize=(12, 5))
plt.plot(segmented['Segment'], segmented['CI_Alpha'], marker='o', label='Alpha CLI')
plt.axhline(y=median_alpha_cli, color='gray', linestyle='--', label='Median Threshold')
plt.scatter(segmented[segmented['label'] == 1]['Segment'], segmented[segmented['label'] == 1]['CI_Alpha'], color='red', label='High Load')
plt.scatter(segmented[segmented['label'] == 0]['Segment'], segmented[segmented['label'] == 0]['CI_Alpha'], color='green', label='Low Load')
plt.title('Cognitive Load Over Time Segments')
plt.xlabel('Segment')
plt.ylabel('Alpha CLI (%)')
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(os.path.join(current_dir, 'graph.png'), dpi=300)
plt.close()

# === Train/Test Split ===
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, stratify=y, test_size=0.3, random_state=42)

# === Train SVM ===
svm = SVC(kernel='rbf', C=1, gamma='scale')
svm.fit(X_train, y_train)
y_pred = svm.predict(X_test)

# Save Model
with open(os.path.join(current_dir, 'trained_model.pkl'), 'wb') as f:
    pickle.dump(svm, f)

# === Evaluation ===
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Low Load', 'High Load']))

# === Confusion Matrix ===
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Low', 'High'], yticklabels=['Low', 'High'])
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.tight_layout()
plt.savefig(os.path.join(current_dir, 'confusion_matrix.png'), dpi=300)
plt.close()

# === Cross-Validation ===
cv_scores = cross_val_score(svm, X_scaled, y, cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42), scoring='accuracy')
print(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# === Merge and Save Outputs ===
merged_data = pd.merge(data, segmented[['Segment', 'CI_Alpha'] + apen_features + ['label']], on='Segment', how='left')

# Predict All Segments and Plot
segmented['svm_label'] = svm.predict(X_scaled)
timestamp_avg = data.groupby('Segment')['timestamp'].mean().reset_index()
segmented = pd.merge(segmented, timestamp_avg, on='Segment')

plt.figure(figsize=(14, 6))
plt.plot(segmented['timestamp'], segmented['CI_Alpha'], marker='o', label='Alpha CLI')
plt.axhline(y=median_alpha_cli, color='gray', linestyle='--', label='Median Threshold')
plt.scatter(segmented[segmented['svm_label'] == 1]['timestamp'], segmented[segmented['svm_label'] == 1]['CI_Alpha'], color='red', label='High Load (SVM)')
plt.scatter(segmented[segmented['svm_label'] == 0]['timestamp'], segmented[segmented['svm_label'] == 0]['CI_Alpha'], color='green', label='Low Load (SVM)')
plt.xticks(rotation=45)
plt.title('Cognitive Load Over Time (SVM Predictions)')
plt.xlabel('Time')
plt.ylabel('Alpha CLI (%)')
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(os.path.join(current_dir, 'graph_svm.png'), dpi=300)
plt.close()

# Save Final CSV
merged_data.to_csv(os.path.join(current_dir, "model_output.csv"), index=False)

# === Confirmation ===
print("\n=== Files Saved ===")
for fname in ['graph.png', 'confusion_matrix.png', 'graph_svm.png', 'model_output.csv', 'trained_model.pkl']:
    path = os.path.join(current_dir, fname)
    print(f"{fname}: {'Exists' if os.path.exists(path) else 'Missing'} ({os.path.getsize(path)} bytes)")
