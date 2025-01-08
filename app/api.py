import pandas as pd
from flask import Blueprint, request, jsonify
from app import utils

bp_api = Blueprint('api', __name__)

@bp_api.route('/api/get/calc/manual', methods=['POST'])
def get_calc_manual():
    data_request = request.json

    try:
        result = utils.manual_calculation(data_request)

        return jsonify({'status': 'success', 'data': result})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/get/calc/file', methods=['POST'])
def get_calc_file():
    data = request.files

    if 'file' not in data:
        return jsonify({'error': 'No file part'}), 400

    file = data['file']
    model = request.form.get('model', 'none')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not file.filename.endswith(('.xls', '.xlsx')):
        return jsonify({'error': 'Invalid file format. Only .xls and .xlsx files are allowed.'}), 400

    if file.content_type not in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']:
        return jsonify({'error': 'Invalid file format. Only Excel files are allowed.'}), 400

    try:
        df = pd.read_excel(file, engine='openpyxl')
        df = df.fillna('')
        data_file = df.to_dict(orient='records')

        result = utils.array_calculation(data_file, model)
        return jsonify({'status': 'success', 'data': result})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500