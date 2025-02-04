import pandas as pd
import threading

from flask import Blueprint, request, jsonify
from app import utils, db, calc

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


        if session in result_all:
            del result_all[session]

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

@bp_api.route('/api/contoh/q', methods=['GET'])
def contoh_q():
    code = 'code'
    description = 'description'
    indicator = 'indikator'
    harga_barang = 25000
    ongkos_pesan = 2500000
    ongkos_simpan = 5000
    ongkos_kekurangan = 100000
    rata_rata_permintaan = 100000
    standar_deviasi = 10000
    lead_time = 0.25

    try:
        result = calc.model_q(code, description, indicator, harga_barang, ongkos_pesan, ongkos_simpan, ongkos_kekurangan, rata_rata_permintaan, standar_deviasi, lead_time)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/contoh/wilson', methods=['GET'])
def contoh_wilson():
    Permintaan_Barang_ModelWilson_D = 10000
    Harga_barang_ModelWilson_p = 8000
    Ongkos_Pesan_ModelWilson_A = 1000000
    Lead_Time_ModelWilson_L = 0.25
    Ongkos_Simpan_ModelWilson_h = 2000 
    MaterialCode = 'code'
    Material_Description = 'description'
    ABC_Indikator = 'indikator'

    try:
        result = calc.Model_Wilson(Permintaan_Barang_ModelWilson_D,Harga_barang_ModelWilson_p,Ongkos_Pesan_ModelWilson_A,Lead_Time_ModelWilson_L,Ongkos_Simpan_ModelWilson_h,MaterialCode,Material_Description,ABC_Indikator)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/contoh/poisson', methods=['GET'])
def contoh_poisson():
    material_code = "code"
    material_description = "description" 
    abc_indicator = "abc"
    harga_barang = 25000
    ongkos_pesan = 2500
    ongkos_simpan = harga_barang * 0.2
    ongkos_kekurangan = 100000
    rata_rata_permintaan = 4
    standar_deviasi_permintaan = 2
    lead_time = 0.25

    try:
        result = calc.model_poisson(material_code, material_description, abc_indicator, harga_barang, ongkos_pesan, ongkos_simpan, ongkos_kekurangan, rata_rata_permintaan, standar_deviasi_permintaan, lead_time)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/contoh/tchebycheff', methods=['GET'])
def contoh_tchebycheff():
    Harga_Barang_model_Tchebycheff_p = 1000000
    Kerugian_Ketidakadaan_barang_model_Tchebycheff_Cu = 5000000
    Standar_Deviasi_model_Tchebycheff_s = 1.45
    Rata_Rata_Permintaan_barang_model_Tchebycheff_alpha = 3/10
    MaterialCode = "code"
    Material_Description = "description"
    ABC_Indikator = "indicator"

    try:
        result = calc.Model_Tchebycheff_TakTentu(Harga_Barang_model_Tchebycheff_p, Kerugian_Ketidakadaan_barang_model_Tchebycheff_Cu, Standar_Deviasi_model_Tchebycheff_s, Rata_Rata_Permintaan_barang_model_Tchebycheff_alpha, MaterialCode, Material_Description, ABC_Indikator)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/contoh/nonmoving', methods=['GET'])
def contoh_nonmoving():
    Ongkos_pemakaian_komponen_H = 5000000
    Ongkos_Kerugian_akibat_kerusakan_L = 10000000
    Jumlah_komponen_terpasang_m = 5
    MaterialCode = "code"
    Material_Description = "description"
    ABC_Indikator = "indicator"

    try:
        result_regret = calc.Model_MinMaxRegret(Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Jumlah_komponen_terpasang_m, MaterialCode, Material_Description, ABC_Indikator)
        result_linear = calc.model_kerusakan_linear(Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Jumlah_komponen_terpasang_m, MaterialCode, Material_Description, ABC_Indikator)
        result_nonlinear = calc.model_kerusakan_non_linear(Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Jumlah_komponen_terpasang_m, MaterialCode, Material_Description, ABC_Indikator)

        return jsonify({'regret': result_regret, 'linear': result_linear, 'nonlinear': result_nonlinear}), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp_api.route('/api/contoh/bcr', methods=['GET'])
def contoh_bcr():
    material_code = "code"
    material_description = "description" 
    abc_indicator = "abc"
    harga_komponen = 100
    kerugian_komponen = 1000
    suku_bunga = 10
    sisa_operasi = 5
    pola_probabilitas = "uniform"

    try:
        result = calc.model_benefit_cost_ratio(material_code, material_description, abc_indicator, harga_komponen, kerugian_komponen, suku_bunga, sisa_operasi, pola_probabilitas)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

