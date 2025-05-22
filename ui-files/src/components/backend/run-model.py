from flask import Flask, send_file
import subprocess
import os

app = Flask(__name__)

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

@app.route('/get-results')
def get_results():
    # Serve the output CSV file
    csv_path = os.path.join(os.path.dirname(__file__), 'model_output.csv')
    return send_file(csv_path, mimetype='text/csv', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 