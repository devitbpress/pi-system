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