from app import calc

# function untuk convert string ke number
def convert(value):
    if isinstance(value, str):
        if '.' in value:
            return float(value)
        else:
            return int(value)
    else:
        return value

# function untuk menghitung manual
def manual_calculation(data_request):
    model = data_request.get("model")
    items = data_request.get("items")
    data_calc = {}

    if model == 'model q':
        params = (            
            convert(items['rata_rata_permintaan_barang_unit_per_tahun']),
            convert(items['lead_time_per_tahun']),
            convert(items['standar_deviasi_permintaan_barang_unit_per_tahun']),
            convert(items['ongkos_pesan_per_pesan']),
            convert(items['harga_barang_per_unit']),
            convert(items['ongkos_simpan_unit_per_tahun']),
            convert(items['ongkos_kekurangan_inventory_unit_per_tahun']),
            items.get('material_code') or None,
            items.get('material_description') or None,
            items.get('abc_indikator') or None,
        )

        data_calc = calc.Model_Q(*params)

    if model == "model wilson":
        params = (
            convert(items["permintaan_barang_unit_per_tahun"]),
            convert(items["harga_barang_per_unit"]),
            convert(items["ongkos_pesan_per_pesan"]),
            convert(items["lead_time_per_tahun"]),
            convert(items["ongkos_simpan_unit_per_tahun"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikato") or None,
        )

        data_calc = calc.Model_Wilson(*params)

    if model == "model poisson":
        params = (            
            convert(items["rata_rata_permintaan_barang_unit_per_tahun"]),
            convert(items["standar_deviasi_permintaan_barang_unit_per_tahun"]),
            convert(items["lead_time_per_tahun"]),
            convert(items["ongkos_pesan_per_pesan"]),
            convert(items["harga_barang_per_unit"]),
            convert(items["ongkos_simpan_unit_per_tahun"]),
            convert(items["ongkos_kekurangan_inventory_unit_per_tahun"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikato") or None,
        )

        data_calc = calc.Model_Poisson(*params)

    if model == "model tchebycheff":
        params = (
            convert(items["harga_barang_per_unit"]),
            convert(items["kerugian_ketidakadaan_barang_per_unit"]),
            convert(items["standar_deviasi_permintaan_barang"]),
            convert(items["rata_rata_permintaan_barang"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
        )

        data_calc = calc.Model_Tchebycheff_TakTentu(*params)

    if model == "model non moving min max regret":
        params = (
            convert(items["ongkos_pemakaian_komponen"]),
            convert(items["ongkos_kerugian_akibat_kerusakan"]),
            convert(items["jumlah_komponen_terpasang"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
        )

        data_calc = calc.Model_MinMaxRegret(*params)

    if model == "model non moving linear":
        params = (
            convert(items["ongkos_pemakaian_komponen"]),
            convert(items["ongkos_kerugian_akibat_kerusakan"]),
            convert(items["jumlah_komponen_terpasang"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
        )

        data_calc = calc.model_kerusakan_linear(*params)

    if model == "model non moving non linear":
        params = (
            convert(items["ongkos_pemakaian_komponen"]),
            convert(items["ongkos_kerugian_akibat_kerusakan"]),
            convert(items["jumlah_komponen_terpasang"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
        )

        data_calc = calc.model_kerusakan_non_linear(*params)

    if model == "model bcr":
        params = (
            convert(items["harga_komponen"]),
            convert(items["kerugian_komponen"]),
            convert(items["suku_bunga"]),
            convert(items["waktu_sisa_operasi"]),
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
        )

        data_calc = calc.Model_Inventori_BCR(*params)

    return data_calc

# function untuk menghitung dari array
def array_calculation(data_request, model):
    data_calc = []

    if model == "model wilson":
        required_keys = ["Permintaan Barang (D) Unit/Tahun","Harga Barang (p) /Unit","Ongkos Pesan (A) /Pesan","Lead Time (L) Tahun","Ongkos Simpan (h) /Unit/Tahun","Material Code","Material Description","ABC Indicator"]

        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Permintaan Barang (D) Unit/Tahun"]),
                convert(item["Harga Barang (p) /Unit"]),
                convert(item["Ongkos Pesan (A) /Pesan"]),
                convert(item["Lead Time (L) Tahun"]),
                convert(item["Ongkos Simpan (h) /Unit/Tahun"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.Model_Wilson(*params))

    if model == "model tchebycheff":
        required_keys = ["Harga Barang (p) /Unit","Kerugian Ketidakadaan Barang (Cu) /Unit","Standar Deviasi Permintaan Barang (s)","Rata - Rata Permintaan Barang (alpha)"]

        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Harga Barang (p) /Unit"]),
                convert(item["Kerugian Ketidakadaan Barang (Cu) /Unit"]),
                convert(item["Standar Deviasi Permintaan Barang (s)"]),
                convert(item["Rata - Rata Permintaan Barang (alpha)"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.Model_Tchebycheff_TakTentu(*params))

    if model == "model q":
        required_keys = ["Rata - Rata Permintaan Barang (D) Unit/Tahun","Lead Time (L) Tahun","Standar Deviasi Permintaan Barang (s) Unit/Tahun","Ongkos Pesan (A) /Pesan","Harga Barang (p) /Unit","Ongkos Simpan (h) /Unit/Tahun","Ongkos Kekurangan Inventori (Cu) /Unit/Tahun","Material Code","Material Description","ABC Indicator"]

        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (            
                convert(item['Rata - Rata Permintaan Barang (D) Unit/Tahun']),
                convert(item['Lead Time (L) Tahun']),
                convert(item['Standar Deviasi Permintaan Barang (s) Unit/Tahun']),
                convert(item['Ongkos Pesan (A) /Pesan']),
                convert(item['Harga Barang (p) /Unit']),
                convert(item['Ongkos Simpan (h) /Unit/Tahun']),
                convert(item['Ongkos Kekurangan Inventori (Cu) /Unit/Tahun']),
                item.get('Material Code') or None,
                item.get('Material Description') or None,
                item.get('ABC Indicator') or None,
            )

            data_calc.append(calc.Model_Q(*params))

    if model == "model poisson":
        required_keys = ["Rata - Rata Permintaan Barang (D) Unit/Tahun","Standar Deviasi Permintaan Barang (s) Unit/Tahun","Lead Time (L) Tahun","Ongkos Pesan (A) /Pesan","Harga Barang (p) /Unit","Ongkos Simpan (h) /Unit/Tahun","Ongkos Kekurangan Inventori (Cu) /Unit/Tahun",]

        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (            
                convert(item["Rata - Rata Permintaan Barang (D) Unit/Tahun"]),
                convert(item["Standar Deviasi Permintaan Barang (s) Unit/Tahun"]),
                convert(item["Lead Time (L) Tahun"]),
                convert(item["Ongkos Pesan (A) /Pesan"]),
                convert(item["Harga Barang (p) /Unit"]),
                convert(item["Ongkos Simpan (h) /Unit/Tahun"]),
                convert(item["Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.Model_Poisson(*params))

    if model == "model non moving min max regret":
        required_keys = ["Ongkos Pemakaian Komponen (H)", "Ongkos Kerugian Akibat Kerusakan (L)", "Jumlah Komponen Terpasang (m)"]
        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Ongkos Pemakaian Komponen (H)"]),
                convert(item["Ongkos Kerugian Akibat Kerusakan (L)"]),
                convert(item["Jumlah Komponen Terpasang (m)"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.Model_MinMaxRegret(*params))

    if model == "model non moving linear":
        required_keys = ["Ongkos Pemakaian Komponen (H)", "Ongkos Kerugian Akibat Kerusakan (L)", "Jumlah Komponen Terpasang (m)"]
        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Ongkos Pemakaian Komponen (H)"]),
                convert(item["Ongkos Kerugian Akibat Kerusakan (L)"]),
                convert(item["Jumlah Komponen Terpasang (m)"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.model_kerusakan_linear(*params))

    if model == "model non moving non linear":
        required_keys = ["Ongkos Pemakaian Komponen (H)", "Ongkos Kerugian Akibat Kerusakan (L)", "Jumlah Komponen Terpasang (m)"]
        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Ongkos Pemakaian Komponen (H)"]),
                convert(item["Ongkos Kerugian Akibat Kerusakan (L)"]),
                convert(item["Jumlah Komponen Terpasang (m)"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.model_kerusakan_non_linear(*params))

    if model == "model bcr":
        required_keys = ["Harga Komponen (Ho)", "Kerugian Komponen (Co)", "Suku Bunga (I)", "Waktu Sisa Operasi (tahun)"]

        for item in data_request:
            missing_keys = [key for key in required_keys if key not in item]
            if missing_keys:
                return {'status': 'error', 'message': f"Missing keys: {', '.join(missing_keys)}"}

            params = (
                convert(item["Harga Komponen (Ho)"]),
                convert(item["Kerugian Komponen (Co)"]),
                convert(item["Suku Bunga (I)"]),
                convert(item["Waktu Sisa Operasi (tahun)"]),
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
            )

            data_calc.append(calc.Model_Inventori_BCR(*params))

    return data_calc

