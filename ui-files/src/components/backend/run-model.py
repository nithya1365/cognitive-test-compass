from flask import Flask, send_file
from flask_cors import CORS
import subprocess
import os


app = Flask(__name__)
CORS(app)

@app.route('/run-model', methods=['POST'])
def run_model():
    # Run the model.py script
    subprocess.run(['python3', 'model.py'])
    return {'status': 'Model run complete'}

@app.route('/get-graph')
def get_graph():
    # Serve the generated graph image (assume it's saved as 'graph.png')
    graph_path = os.path.join(os.path.dirname(__file__), 'graph.png')
    return send_file(graph_path, mimetype='image/png')

@app.route('/get-confusion-matrix')
def get_confusion_matrix():
    cm_path = os.path.join(os.path.dirname(__file__), 'confusion_matrix.png')
    return send_file(cm_path, mimetype='image/png')

@app.route('/get-graph-svm')
def get_graph_svm():
    svm_path = os.path.join(os.path.dirname(__file__), 'graph_svm.png')
    return send_file(svm_path, mimetype='image/png')

@app.route('/get-results')
def get_results():
    # Serve the output CSV file
    csv_path = os.path.join(os.path.dirname(__file__), 'model_output.csv')
    return send_file(csv_path, mimetype='text/csv', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 