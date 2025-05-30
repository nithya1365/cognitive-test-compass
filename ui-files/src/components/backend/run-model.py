from flask import Flask, send_file, jsonify
from flask_cors import CORS
import subprocess
import os
import sys


app = Flask(__name__)
CORS(app)

def get_backend_dir():
    return os.path.dirname(os.path.abspath(__file__))

@app.route('/run-model', methods=['GET', 'POST'])
def run_model():
    try:
        # Get the backend directory
        backend_dir = get_backend_dir()
        print(f"\n=== Backend Directory ===")
        print(f"Backend directory: {backend_dir}")
        print(f"Current working directory: {os.getcwd()}")
        
        # Check if CSV file exists
        csv_path = os.path.join(backend_dir, 'bci_calm.csv')
        print(f"\n=== Checking CSV File ===")
        print(f"Looking for CSV at: {csv_path}")
        if not os.path.exists(csv_path):
            return jsonify({
                'status': 'Error',
                'message': f'CSV file not found at {csv_path}'
            }), 404
        print(f"CSV file found: {os.path.getsize(csv_path)} bytes")

        # Change to backend directory
        print(f"\n=== Changing Directory ===")
        print(f"Changing to: {backend_dir}")
        os.chdir(backend_dir)
        print(f"Current working directory: {os.getcwd()}")
        
        # Run the model.py script
        print(f"\n=== Running Model ===")
        result = subprocess.run([sys.executable, 'model.py'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        
        print(f"\n=== Model Output ===")
        print(result.stdout)
        
        # Check if output files were created
        output_files = {
            'graph': os.path.join(backend_dir, 'graph.png'),
            'confusion_matrix': os.path.join(backend_dir, 'confusion_matrix.png'),
            'graph_svm': os.path.join(backend_dir, 'graph_svm.png'),
            'model_output': os.path.join(backend_dir, 'model_output.csv'),
            'trained_model': os.path.join(backend_dir, 'trained_model.pkl')
        }
        
        # Verify each file exists and has content
        print(f"\n=== Checking Output Files ===")
        file_status = {}
        for name, path in output_files.items():
            exists = os.path.exists(path)
            size = os.path.getsize(path) if exists else 0
            file_status[name] = {
                'exists': exists,
                'size': size,
                'path': path
            }
            print(f"{name}: {'EXISTS' if exists else 'MISSING'} (Size: {size} bytes)")
        
        # Check for missing or empty files
        missing_files = [name for name, status in file_status.items() 
                        if not status['exists'] or status['size'] == 0]
        
        if missing_files:
            return jsonify({
                'status': 'Warning',
                'message': f'Model ran but some output files are missing or empty: {", ".join(missing_files)}',
                'file_status': file_status,
                'output': result.stdout
            }), 200
        
        return jsonify({
            'status': 'Success',
            'message': 'Model run complete',
            'file_status': file_status,
            'output': result.stdout
        }), 200
        
    except subprocess.CalledProcessError as e:
        print(f"\n=== Error Output ===")
        print(e.stderr)
        return jsonify({
            'status': 'Error',
            'message': f'Error running model: {str(e)}',
            'error_output': e.stderr
        }), 500
    except Exception as e:
        print(f"\n=== Unexpected Error ===")
        print(str(e))
        return jsonify({
            'status': 'Error',
            'message': f'Unexpected error: {str(e)}'
        }), 500

@app.route('/get-model-status')
def get_model_status():
    try:
        model_path = os.path.join(get_backend_dir(), 'svm_model.pkl')
        if os.path.exists(model_path):
            size = os.path.getsize(model_path)
            return jsonify({
                'status': 'success',
                'message': 'Model file exists',
                'size': size,
                'path': model_path
            })
        return jsonify({
            'status': 'error',
            'message': 'Model file not found',
            'path': model_path
        }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error checking model status: {str(e)}'
        }), 500

@app.route('/get-graph')
def get_graph():
    graph_path = os.path.join(get_backend_dir(), 'graph.png')
    if os.path.exists(graph_path):
        return send_file(graph_path, mimetype='image/png')
    return jsonify({'error': 'Graph not found'}), 404

@app.route('/get-confusion-matrix')
def get_confusion_matrix():
    cm_path = os.path.join(get_backend_dir(), 'confusion_matrix.png')
    if os.path.exists(cm_path):
        return send_file(cm_path, mimetype='image/png')
    return jsonify({'error': 'Confusion matrix not found'}), 404

@app.route('/get-graph-svm')
def get_graph_svm():
    svm_path = os.path.join(get_backend_dir(), 'graph_svm.png')
    if os.path.exists(svm_path):
        return send_file(svm_path, mimetype='image/png')
    return jsonify({'error': 'SVM graph not found'}), 404

@app.route('/get-results')
def get_results():
    csv_path = os.path.join(get_backend_dir(), 'model_output.csv')
    if os.path.exists(csv_path):
        return send_file(csv_path, mimetype='text/csv', as_attachment=True)
    return jsonify({'error': 'Results file not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5001) 