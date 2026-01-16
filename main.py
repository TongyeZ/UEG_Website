# main.py
from flask import Flask, render_template, request, jsonify
import pandas as pd

app = Flask(__name__)

# Read the CSV file
ueg_data = pd.read_csv('/Users/sophiazhang/Desktop/Projects/UEG_Website_Program/UbiquitouslyExpressedGenes/data/Table 7. The global expression specificity and global expression patterns of human genes.csv')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/graph')
def graph():
    return render_template('graph.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/get_global_expression_specificity_data')
def get_global_expression_specificity_data():
    scatter_plot_data = {
        'Q50': ueg_data['Q50'].tolist(),
        'Q95':ueg_data['Q95'].tolist(),
        'Variance': ueg_data['Variance'].tolist(),
        'IQR': ueg_data['IQR'].tolist(),
        'Recount2_SEP_TPM_0_1': ueg_data['Recount2_SEP_TPM_0_1'].tolist(),
        'GeneID': ueg_data['GeneID'].tolist()
    }
    return jsonify(scatter_plot_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=81)
