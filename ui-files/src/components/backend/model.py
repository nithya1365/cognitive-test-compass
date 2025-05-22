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
warnings.filterwarnings('ignore')

# === Step 1: Load EEG Data ===
file_path = 'bci_calm.csv'  # Update path as needed
data = pd.read_csv(file_path)
data['Timestamp'] = pd.to_datetime(data['Timestamp'])

# === Step 2: Define baseline (first 1 minute) ===
start_time = data['Timestamp'].min()
baseline_end = start_time + pd.Timedelta(seconds=60)
baseline_df = data[data['Timestamp'] <= baseline_end]
task_df = data[data['Timestamp'] > baseline_end]

baseline_alpha = baseline_df['Alpha'].mean()
baseline_beta = baseline_df['Beta'].mean()
baseline_theta = baseline_df['Theta'].mean()

print("\n=== Baseline Band Powers ===")
print(f"Alpha: {baseline_alpha:.4f}, Beta: {baseline_beta:.4f}, Theta: {baseline_theta:.4f}")

# === Step 3: Segment the data ===
data['Seconds'] = (data['Timestamp'] - data['Timestamp'].iloc[0]).dt.total_seconds()
segment_length = 3  # 20-second segments
data['Segment'] = (data['Seconds'] // segment_length).astype(int)

# === Step 4: Compute band power averages and CLI features ===
def compute_ci(baseline, current):
    return ((baseline - current) / baseline) * 100

segmented = data.groupby('Segment')[['Alpha', 'Beta', 'Theta']].mean().reset_index()
segmented['CI_Alpha'] = compute_ci(baseline_alpha, segmented['Alpha'])
segmented['CI_Beta'] = compute_ci(baseline_beta, segmented['Beta'])
segmented['CI_Theta'] = compute_ci(baseline_theta, segmented['Theta'])


# Optional: include ApEn features if present
for apen_col in ['ApEn_Alpha', 'ApEn_Beta', 'ApEn_Theta']:
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
if 'ApEn_Alpha' in segmented.columns:
    feature_cols.append('ApEn_Alpha')

X = segmented[feature_cols].copy()
y = segmented['label']

# === Step 7: Handle missing/infinite values ===
X.replace([np.inf, -np.inf], np.nan, inplace=True)
X = SimpleImputer(strategy='mean').fit_transform(X)

# === Step 8: Normalize features ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === Plot Alpha Cognitive Load Index Over Segments ===
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
plt.savefig('graph.png', bbox_inches='tight')
plt.close()

# === Step 9: Train/test split ===
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, stratify=y, test_size=0.3, random_state=42)

# === Step 10: Train SVM model ===
svm = SVC(kernel='rbf', C=1, gamma='scale')
svm.fit(X_train, y_train)
y_pred = svm.predict(X_test)



# === Step 11: Evaluation ===
print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=['Low Load', 'High Load']))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Low', 'High'], yticklabels=['Low', 'High'])
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.tight_layout()
plt.savefig('confusion_matrix.png', bbox_inches='tight')
plt.close()


# === Step 12: Cross-validation Accuracy ===
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(svm, X_scaled, y, cv=skf, scoring='accuracy')

print(f"\n10-Fold Cross-Validation Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")


# === Step 13: Merge original data with computed cognitive load info ===

# First, merge the computed features and label into the original data using Segment
merged_data = pd.merge(data, segmented[['Segment', 'CI_Alpha'] +
                                       ([ 'ApEn_Alpha'] if 'ApEn_Alpha' in segmented.columns else []) +
                                       ['label']], on='Segment', how='left')


# === Predict Cognitive Load Using the Trained SVM Model ===
svm_preds = svm.predict(X_scaled)  # Predict on all segments (full data)
segmented['svm_label'] = svm_preds

# === Step 1: Compute average timestamp per segment for X-axis ===
timestamp_avg = data.groupby('Segment')['Timestamp'].mean().reset_index()
segmented = pd.merge(segmented, timestamp_avg, on='Segment')

# === Step 2: Plot CLI over time (with SVM predictions) ===
plt.figure(figsize=(14, 6))
plt.plot(segmented['Timestamp'], segmented['CI_Alpha'], marker='o', linestyle='-', label='Alpha CLI (∂)')
plt.axhline(y=median_alpha_cli, color='gray', linestyle='--', label='Median Threshold')

# Highlight based on SVM predictions
high_pred = segmented[segmented['svm_label'] == 1]
low_pred = segmented[segmented['svm_label'] == 0]

plt.scatter(high_pred['Timestamp'], high_pred['CI_Alpha'], color='red', label='High Load (SVM)')
plt.scatter(low_pred['Timestamp'], low_pred['CI_Alpha'], color='green', label='Low Load (SVM)')

plt.title('Cognitive Load (Alpha CLI ∂) Over Time (Using SVM Predictions)')
plt.xlabel('Time')
plt.ylabel('Alpha Cognitive Index (%)')
plt.xticks(rotation=45)
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig('graph_svm.png', bbox_inches='tight')
plt.close()





# Save the full merged data
output_file = "model_output.csv"
merged_data.to_csv(output_file, index=False)

print(f"\n✅ Full cognitive load dataset (including original + CI + labels) saved to: {output_file}")