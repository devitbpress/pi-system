import pandas as pd
import threading

from flask import Blueprint, request, jsonify
from app import utils, db

bp_api = Blueprint('api', __name__)

result_all = {}

#  autentikasi
@bp_api.route("/api/masuk", methods=['POST'])
def get_masuk():
    try:
        email = request.json.get('email', "")
        password = request.json.get('password', "")

        user = db.get_user(email, password)

        return jsonify(user)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    model = request.form.get('item', 'none')

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

        if 'status' in result:
            return jsonify({'status': 'error', 'message': result['message']})
        else:
            return jsonify({'status': 'success', 'data': result})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/push/analysis/file', methods=['POST'])
def push_file_analysis():
    data = request.files

    if 'file' not in data:
        return jsonify({'error': 'No file part'}), 400

    file = data['file']
    id_file = request.form.get('file_id')
    session = request.form.get('item')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not file.filename.endswith(('.xls', '.xlsx', '.XLS', '.XLSX')):
        return jsonify({'error': 'Invalid file format. Only .xls and .xlsx files are allowed.'}), 400

    if file.content_type not in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']:
        return jsonify({'error': 'Invalid file format. Only Excel files are allowed.'}), 400

    try:
        result = utils.upload_file(file, id_file, session)

        if 'status' in result:
            return jsonify({'status': 'error', 'message': result['message']})
        else:
            return jsonify({'status': 'success', 'data': result})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/delete/analysis/file', methods=['POST'])
def delete_file_analysis():
    data = request.json

    try:
        result = utils.delete_file(str(data.get('file_id')), data.get('session'))

        if result['status'] == 'success' :
            return jsonify({'status': 'success', 'message': result['message']})
        else:
            return jsonify({'status': 'error', 'message': result['message']})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/get/analysis/proses', methods=['POST'])
def get_processing():
    try:
        session = request.json.get("session")
        if session in result_all:
            del result_all[session]

        def background_process(session):
            result_merge = utils.processing_merge(session)
            if session not in result_all:
                result_all[session] = { 'merge': [] }
            result_all[session]['merge'] = result_merge

            result_classification = utils.processing_classification(result_merge)
            if 'classification' not in result_all[session]:
                result_all[session]['classification'] = []
            result_all[session]['classification'] = result_classification

            result_model = utils.processing_model(result_classification)
            if 'model' not in result_all[session]:
                result_all[session]['model'] = []
            result_all[session]['model'] = result_model

        thread = threading.Thread(target=background_process, args=(session,))
        thread.start()

        return jsonify(['processing']), 200

    except Exception as e:
        return jsonify(['error', str(e)]), 500

@bp_api.route('/api/get/product', methods=['POST'])
def get_product():
    data = request.json
    try:
        result = db.get_product(data['item'])
        if result['status'] == 'success':
            return jsonify({'status': 'success', 'data': result['data']}), 200
        else:
            return jsonify({'status': 'failed', 'message': result['message']}), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 200

@bp_api.route('/api/get/result', methods=['POST'])
def get_result():
    data_request = request.json
    try:
        session = data_request.get("session")
        field = data_request.get('field')

        data = result_all.get(session, {}).get(field, None)

        if data is not None:
            if isinstance(data, pd.DataFrame):
                data = data.fillna('')
                data = data.applymap(lambda x: str(x) if isinstance(x, pd.Period) else x)
                data = data.to_dict(orient='records')
            return jsonify({'status': 'success', 'data': data}), 200
        else:
            return jsonify({'status': 'processing', 'message': 'Result not available yet for this session.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp_api.route('/api/delete/session', methods=['POST'])
def delete_session():
    data_request = request.json
    try:
        session = data_request.get("session")    

        print(len(result_all))

        if session in result_all:
            del result_all[session]

        print(len(result_all))
        utils.delete_sesion(session)

        return jsonify({'status': 'success', 'message': 'session delete'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp_api.route('/api/put/product', methods=['POST'])
def put_product():
    data = request.json
    try:
        result = db.put_product(data["value"], data['field'], data["p_id"])

        if result['status'] == 'success':
            return jsonify({'status': 'success', 'data': result['data']}), 200
        else:
            return jsonify({'status': 'error', 'message': result['message']}), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500