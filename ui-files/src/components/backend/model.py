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
warnings.filterwarnings('ignore')

# Get the directory where this script is located
current_dir = os.path.dirname(os.path.abspath(__file__))
print(f"\n=== Current Working Directory ===")
print(f"Script directory: {current_dir}")
print(f"Current working directory: {os.getcwd()}")

# === Step 1: Load EEG Data ===
file_path = os.path.join(current_dir, 'bci_calm.csv')
print(f"\n=== Loading Data ===")
print(f"Looking for CSV file at: {file_path}")
if not os.path.exists(file_path):
    raise FileNotFoundError(f"CSV file not found at {file_path}")

data = pd.read_csv(file_path)
print(f"Successfully loaded CSV file with {len(data)} rows")
data['timestamp'] = pd.to_datetime(data['timestamp'])

# === Step 2: Define baseline (first 1 minute) ===
start_time = data['timestamp'].min()
baseline_end = start_time + pd.Timedelta(seconds=60)
baseline_df = data[data['timestamp'] <= baseline_end]
task_df = data[data['timestamp'] > baseline_end]

baseline_alpha = baseline_df['alpha'].mean()
baseline_beta = baseline_df['beta'].mean()
baseline_theta = baseline_df['theta'].mean()

print("\n=== Baseline Band Powers ===")
print(f"Alpha: {baseline_alpha:.4f}, Beta: {baseline_beta:.4f}, Theta: {baseline_theta:.4f}")

# === Step 3: Segment the data ===
data['Seconds'] = (data['timestamp'] - data['timestamp'].iloc[0]).dt.total_seconds()
segment_length = 3  # 20-second segments
data['Segment'] = (data['Seconds'] // segment_length).astype(int)

# === Step 4: Compute band power averages and CLI features ===
def compute_ci(baseline, current):
    return ((baseline - current) / baseline) * 100

segmented = data.groupby('Segment')[['alpha', 'beta', 'theta']].mean().reset_index()
segmented['CI_Alpha'] = compute_ci(baseline_alpha, segmented['alpha'])
segmented['CI_Beta'] = compute_ci(baseline_beta, segmented['beta'])
segmented['CI_Theta'] = compute_ci(baseline_theta, segmented['theta'])

# Optional: include ApEn features if present
for apen_col in ['alpha_apen', 'beta_apen', 'theta_apen']:
    if apen_col in data.columns:
        segmented[apen_col] = data.groupby('Segment')[apen_col].mean().values

# === Step 5: Binary labels using Alpha CLI (median split) ===
# Calculate median before using it in the plot
median_alpha_cli = segmented['CI_Alpha'].median()
segmented['label'] = segmented['CI_Alpha'].apply(lambda x: 1 if x > median_alpha_cli else 0)

print("\n=== Label Distribution ===")
print(segmented['label'].value_counts())

# === Step 6: Prepare features and labels ===
#feature_cols = ['CI_Alpha', 'CI_Beta', 'CI_Theta'] + [col for col in segmented.columns if col.startswith('ApEn')]
feature_cols = ['CI_Alpha']
if 'alpha_apen' in segmented.columns:
    feature_cols.append('alpha_apen')

X = segmented[feature_cols].copy()
y = segmented['label']

# === Step 7: Handle missing/infinite values ===
X.replace([np.inf, -np.inf], np.nan, inplace=True)
X = SimpleImputer(strategy='mean').fit_transform(X)

# === Step 8: Normalize features ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === Plot Alpha Cognitive Load Index Over Segments ===
print("\n=== Generating Main Graph ===")
plt.figure(figsize=(12, 5))
plt.plot(segmented['Segment'], segmented['CI_Alpha'], marker='o', linestyle='-', label='Alpha CLI (∂)')
# Now median_alpha_cli is defined
plt.axhline(y=median_alpha_cli, color='gray', linestyle='--', label='Median Threshold')

# Highlight high and low load segments
high_load = segmented[segmented['label'] == 1]
low_load = segmented[segmented['label'] == 0]

plt.scatter(high_load['Segment'], high_load['CI_Alpha'], color='red', label='High Load')
plt.scatter(low_load['Segment'], low_load['CI_Alpha'], color='green', label='Low Load')

plt.title('Cognitive Load (Alpha CLI ∂) Over Time Segments')
plt.xlabel('Segment Index (Time Window)')
plt.ylabel('Alpha Cognitive Index (%)')
plt.legend()
plt.grid(True)
plt.tight_layout()

# Save main graph
graph_path = os.path.join(current_dir, 'graph.png')
print(f"Saving main graph to: {graph_path}")
plt.savefig(graph_path, bbox_inches='tight', dpi=300)
plt.close()
print(f"Main graph saved successfully")

# === Step 9: Train/test split ===
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, stratify=y, test_size=0.3, random_state=42)

# === Step 10: Train SVM model ===
svm = SVC(kernel='rbf', C=1, gamma='scale')
svm.fit(X_train, y_train)
y_pred = svm.predict(X_test)

# === Step 11: Evaluation ===
print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=['Low Load', 'High Load']))

# === Generate and save confusion matrix ===
print("\n=== Generating Confusion Matrix ===")
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Low Load', 'High Load'], 
            yticklabels=['Low Load', 'High Load'])
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.tight_layout()

# Save confusion matrix with explicit path
cm_path = os.path.join(current_dir, 'confusion_matrix.png')
print(f"Saving confusion matrix to: {cm_path}")
plt.savefig(cm_path, bbox_inches='tight', dpi=300)
plt.close()
print(f"Confusion matrix saved successfully")

# Verify the confusion matrix was saved
if os.path.exists(cm_path):
    print(f"Confusion matrix file exists: {os.path.getsize(cm_path)} bytes")
else:
    print("WARNING: Confusion matrix file was not created!")

# === Step 12: Cross-validation Accuracy ===
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(svm, X_scaled, y, cv=skf, scoring='accuracy')

print(f"\n10-Fold Cross-Validation Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# === Step 13: Merge original data with computed cognitive load info ===

# First, merge the computed features and label into the original data using Segment
merged_data = pd.merge(data, segmented[['Segment', 'CI_Alpha'] +
                                       ([ 'alpha_apen'] if 'alpha_apen' in segmented.columns else []) +
                                       ['label']], on='Segment', how='left')

# === Predict Cognitive Load Using the Trained SVM Model ===
svm_preds = svm.predict(X_scaled)  # Predict on all segments (full data)
segmented['svm_label'] = svm_preds

# === Step 1: Compute average timestamp per segment for X-axis ===
timestamp_avg = data.groupby('Segment')['timestamp'].mean().reset_index()
segmented = pd.merge(segmented, timestamp_avg, on='Segment')

# === Step 2: Plot CLI over time (with SVM predictions) ===
print("\n=== Generating SVM Graph ===")
plt.figure(figsize=(14, 6))
plt.plot(segmented['timestamp'], segmented['CI_Alpha'], marker='o', linestyle='-', label='Alpha CLI (∂)')
plt.axhline(y=median_alpha_cli, color='gray', linestyle='--', label='Median Threshold')

# Highlight based on SVM predictions
high_pred = segmented[segmented['svm_label'] == 1]
low_pred = segmented[segmented['svm_label'] == 0]

plt.scatter(high_pred['timestamp'], high_pred['CI_Alpha'], color='red', label='High Load (SVM)')
plt.scatter(low_pred['timestamp'], low_pred['CI_Alpha'], color='green', label='Low Load (SVM)')

plt.title('Cognitive Load (Alpha CLI ∂) Over Time (Using SVM Predictions)')
plt.xlabel('Time')
plt.ylabel('Alpha Cognitive Index (%)')
plt.xticks(rotation=45)
plt.legend()
plt.grid(True)
plt.tight_layout()

# Save SVM graph
svm_graph_path = os.path.join(current_dir, 'graph_svm.png')
print(f"Saving SVM graph to: {svm_graph_path}")
plt.savefig(svm_graph_path, bbox_inches='tight', dpi=300)
plt.close()
print(f"SVM graph saved successfully")

# Save the full merged data
output_file = os.path.join(current_dir, "model_output.csv")
print(f"\n=== Saving Model Output ===")
print(f"Saving model output to: {output_file}")
merged_data.to_csv(output_file, index=False)
print(f"Model output saved successfully")

# Print final confirmation of all saved files
print("\n=== Final File Status ===")
for file_name in ['graph.png', 'confusion_matrix.png', 'graph_svm.png', 'model_output.csv']:
    file_path = os.path.join(current_dir, file_name)
    exists = os.path.exists(file_path)
    size = os.path.getsize(file_path) if exists else 0
    print(f"{file_name}: {'EXISTS' if exists else 'MISSING'} (Size: {size} bytes)")