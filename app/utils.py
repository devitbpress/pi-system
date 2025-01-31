import pandas as pd
import numpy as np
import random

from scipy.stats import f, shapiro, kstest, poisson, chisquare
from app import calc
from app import db

data_result = {}

# function untuk convert string ke number
def convert(value):
    if isinstance(value, str):
        if '.' in value:
            return float(value)
        else:
            return int(value)
    else:
        return value

# function untuk delete file per session
def delete_sesion(session):
    if session in data_result:
        del data_result[session]

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
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikato") or None,
            convert(items["harga_barang_per_unit"]),
            convert(items["ongkos_pesan_per_pesan"]),
            convert(items["ongkos_simpan_unit_per_tahun"]),
            convert(items["ongkos_kekurangan_inventory_unit_per_tahun"]),
            convert(items["rata_rata_permintaan_barang_unit_per_tahun"]),
            convert(items["standar_deviasi_permintaan_barang_unit_per_tahun"]),
            convert(items["lead_time_per_tahun"]),
        )

        data_calc = calc.model_poisson(*params)

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
            items.get("material_code") or None,
            items.get("material_description") or None,
            items.get("abc_indikator") or None,
            convert(items["harga_komponen"]),
            convert(items["kerugian_komponen"]),
            convert(items["suku_bunga"]),
            convert(items["waktu_sisa_operasi"]),
            items.get("probabilitas"),
        )

        data_calc = calc.model_benefit_cost_ratio(*params)

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
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
                convert(item["Harga Barang (p) /Unit"]),
                convert(item["Ongkos Pesan (A) /Pesan"]),
                convert(item["Ongkos Simpan (h) /Unit/Tahun"]),
                convert(item["Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"]),
                convert(item["Rata - Rata Permintaan Barang (D) Unit/Tahun"]),
                convert(item["Standar Deviasi Permintaan Barang (s) Unit/Tahun"]),
                convert(item["Lead Time (L) Tahun"]),
            )

            data_calc.append(calc.model_poisson(*params))

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
                item.get("Material Code") or None,
                item.get("Material Description") or None,
                item.get("ABC Indicator") or None,
                convert(item["Harga Komponen (Ho)"]),
                convert(item["Kerugian Komponen (Co)"]),
                convert(item["Suku Bunga (I)"]),
                convert(item["Waktu Sisa Operasi (tahun)"]),
                item.get("Pola Probabilitas") or 'uniform'
            )

            data_calc.append(calc.model_benefit_cost_ratio(*params))

    return data_calc

# funciton upload file
def upload_file(data_request, id_file, session):
    try:
        df = pd.read_excel(data_request, engine='openpyxl')

        if session not in data_result:
            data_result[session] = {}

        if 'file' not in data_result[session]:
            data_result[session]['file'] = {}

        if id_file not in  data_result[session]['file']:
            data_result[session]['file'][id_file] = df

        df = df.fillna('')
        data_file = df.to_dict(orient='records')
        return data_file

    except Exception as e:
        return {'status': 'error', 'message': str(e)}

# function delete file
def delete_file(id_file, session):
    if session in data_result and id_file in data_result[session]['file']:
        del data_result[session]['file'][id_file]
        return {'status': 'success', 'message': 'File deleted successfully'}

    return {'status': 'error', 'message': 'File not found'}

# function normalisasi dataframe
def normalize_and_combine_dataframes(*df_tuples):
    dfs = []
    for df in df_tuples:
        # Normalize kolom yang ada pada setiap DataFrame
        if 'Movement Type' in df.columns and 'Order' not in df.columns:
            df.insert(df.columns.get_loc('Movement Type'), 'Order', '')

        if 'Material.1' in df.columns:
            df.drop('Material.1', axis=1, inplace=True)

        if 'Unnamed: 8' in df.columns:
            df.rename(columns={'Unnamed: 8': 'Unnamed: 7'}, inplace=True)

        dfs.append(df)  # Tambahkan DataFrame yang telah diubah ke dalam daftar dfs

    # Gabungkan semua DataFrame berdasarkan baris (axis=0)
    df_com_hist = pd.concat(dfs, ignore_index=True)

    # Pastikan 'Posting Date' dalam format datetime
    df_com_hist['Posting Date'] = pd.to_datetime(df_com_hist['Posting Date'], errors='coerce')

    # Buat data kolom periode month untuk aggregate dalam satu bulan
    df_com_hist['Month'] = df_com_hist['Posting Date'].dt.to_period('M')

    # Menambahkan kolom Week dengan nomor minggu yang berulang dari 1 hingga 4
    def week_in_month(date):
        first_day = date.replace(day=1)
        day_of_month = date.day
        adjusted_dom = day_of_month + first_day.weekday()
        return (adjusted_dom - 1) // 7 % 4 + 1

    df_com_hist['Week'] = df_com_hist['Posting Date'].apply(lambda x: f"{x.strftime('%Y-%m')} Week {week_in_month(x)}" if pd.notnull(x) else None)

    df_com_hist['Day'] = df_com_hist['Posting Date'].dt.strftime('%Y-%m-%d')

    condition = df_com_hist['Movement Type'].isin(['105', '201', '261', '351', 'Z61'])
    df_com_hist['Mvt_type'] = np.where(condition, 'Order', 'cancel')

    return df_com_hist

# function agregasi dataframe
def process_data(df):
    # Mengelompokkan data berdasarkan kolom "Material"
    grouped = df.groupby('Material')
    
    # DataFrame untuk menyimpan hasil akhir, unmatched cancels, dan matched rows
    result = pd.DataFrame()
    unmatched_cancels = pd.DataFrame()
    matched_df = pd.DataFrame()
    
    # Iterasi melalui setiap grup
    for material, group in grouped:
        matched_rows = []
        # Memeriksa apakah ada nilai 'cancel' pada kolom 'Mvt_type'
        if 'cancel' in group['Mvt_type'].values:
            # Iterasi melalui baris yang memiliki nilai 'cancel'
            for _, cancel_row in group[group['Mvt_type'] == 'cancel'].iterrows():
                # Mencari baris dengan nilai sama pada kolom 'Unnamed: 7' dan 'Order' pada kolom 'Mvt_type'
                condition = (
                    (group['Unnamed: 7'] == cancel_row['Unnamed: 7']) &
                    (group['Mvt_type'] == 'Order') &
                    (
                        ((group['Movement Type'] == "105") & (cancel_row['Movement Type'] == "106")) |
                        ((group['Movement Type'] == "201") & (cancel_row['Movement Type'] == "202")) |
                        ((group['Movement Type'] == "261") & (cancel_row['Movement Type'] == "262")) |
                        ((group['Movement Type'] == "351") & (cancel_row['Movement Type'] == "352")) |
                        ((group['Movement Type'] == "Z61") & (cancel_row['Movement Type'] == "Z62"))
                    )
                )
                potential_matches = group[condition]
                if not potential_matches.empty:
                    # Menghitung selisih tanggal terdekat
                    potential_matches = potential_matches.copy()  # Avoid SettingWithCopyWarning
                    potential_matches['date_diff'] = (potential_matches['Posting Date'] - cancel_row['Posting Date']).abs()
                    closest_match = potential_matches.loc[potential_matches['date_diff'].idxmin()]
                    # Jika ditemukan, tambahkan baris yang cocok ke list matched_rows
                    matched_rows.append(cancel_row.name)
                    matched_rows.append(closest_match.name)
                    matched_df = pd.concat([matched_df, cancel_row.to_frame().T, closest_match.to_frame().T])
                    
                else:
                    # Jika tidak ditemukan pasangan 'order', tambahkan ke unmatched_cancels
                    unmatched_cancels = pd.concat([unmatched_cancels, cancel_row.to_frame().T])

        # Menyimpan hanya baris yang tidak ada di matched_rows
        unmatched_group = group.drop(index=matched_rows)
        result = pd.concat([result, unmatched_group])
    
    # Reset index untuk hasil akhir
    result.reset_index(drop=True, inplace=True)
    unmatched_cancels.reset_index(drop=True, inplace=True)
    matched_df.reset_index(drop=True, inplace=True)
    
    # Drop semua baris dengan Mvt_type 'cancel' dari result
    result = result[result['Mvt_type'] != 'cancel']
    
    return result

# function agregasi data
def processing_merge(session):
    try:
        dataframes = data_result[session]['file'].values()
        df_com_hist = normalize_and_combine_dataframes(*dataframes)
        filtered_df = process_data(df_com_hist)
        filtered_df = filtered_df.rename(columns={'Material': 'Material_Code', 'Unnamed: 7': 'Quantity(EA)'})
        result = filtered_df[['Posting Date', 'Material_Code', 'Material Description', 'Quantity(EA)', 'Movement Type']]
        return result

    except KeyError as e:
        return e

    except Exception as e:
        return e

# klasifikasi dataframe (classification)
def count_and_stats_by_material(df):
    # Mengelompokkan data berdasarkan kolom 'Material' dan menghitung ukuran grup, rata-rata, variansi, dan standar deviasi
    grouped = df.groupby('Material_Code').agg(
        Jumlah_Data=('Quantity(EA)', 'size'),
        Rata_Rata=('Quantity(EA)', 'mean'),
        Variansi=('Quantity(EA)', 'var'),
        Standar_Deviasi=('Quantity(EA)', 'std'),
        Has_Z61=('Has_Z61', 'any')
    ).reset_index()

    # Mengisi nilai None untuk grup dengan Jumlah Data 0 atau 1
    grouped.loc[grouped['Jumlah_Data'] <= 1, ['Rata_Rata', 'Variansi', 'Standar_Deviasi']] = None

    # Menambahkan kolom 'Proses1' dan mengisi sesuai kondisi
    grouped['Kategori'] = None
    grouped['Proses1'] = None
    grouped['Proses2'] = None
    grouped['P_Value'] = 0.0
    grouped['Deskripsi_Pengujian_Statistik'] = None
    grouped['Hasil_uji'] = None

    grouped.loc[grouped['Jumlah_Data'] == 0, 'Proses1'] = 'PT'
    grouped.loc[grouped['Jumlah_Data'] >= 30, 'Proses1'] = 'PN'
    grouped.loc[(grouped['Jumlah_Data'] > 0) & (grouped['Jumlah_Data'] < 30), 'Proses1'] = 'PP'

    # Mengisi nilai None untuk kolom 'Proses2' berdasarkan kondisi awal
    mask = (grouped['Standar_Deviasi'] == 0) & (grouped['Variansi'] == 0) & (grouped['Proses1'].isin(['PN', 'PP']))
    grouped.loc[mask, 'Proses2'] = 'MD'
    mask2 = (grouped['Jumlah_Data'] == 1) & (grouped['Proses1'].isin(['PN', 'PP']))
    grouped.loc[mask2, 'Proses2'] = 'MT'
    mask3 = (grouped['Has_Z61'] == True)
    grouped.loc[mask3, 'Proses2'] = 'MD'

    for idx, row in grouped.iterrows():
        material_data = df[df['Material_Code'] == row['Material_Code']]['Quantity(EA)']

        if row['Proses1'] in ['PN', 'PP'] and row['Standar_Deviasi'] is not None and row['Proses2'] is None:
            # Pengujian F-test pada alpha 5%
            f_value = row['Variansi'] / 1e-10  # Variansi 0 diasumsikan sangat kecil
            dfn = row['Jumlah_Data'] - 1
            dfd = 1e10  # Degrees of freedom for the assumed zero variance group
            p_value_ftest = 1 - f.cdf(f_value, dfn, dfd)
            grouped.at[idx, 'P_Value'] = p_value_ftest
            grouped.at[idx, 'Hasil_uji'] = 'Ya' if p_value_ftest < 0.05 else 'Tidak'
            grouped.at[idx, 'Deskripsi_Pengujian_Statistik'] = f"Material dengan kode {row['Material_Code']} telah dilakukan pengujian statistik dengan metode Uji F dengan Tingkat Signifikansi 5%. {'Berhasil' if p_value_ftest < 0.05 else 'Tidak Berhasil'} menolak Hypotesis Null."

            if grouped.at[idx, 'Hasil_uji'] == 'Tidak':
                grouped.at[idx, 'Proses2'] = 'MD'
                continue

            # Jika F-test signifikan, lanjutkan dengan pengujian normalitas atau Poisson
            if row['Proses1'] == 'PN' and row['Proses2'] is None:
                # Uji Shapiro-Wilk pada alpha 5%
                stat, p_value_shapiro = shapiro(material_data)
                grouped.at[idx, 'P_Value'] = p_value_shapiro
                grouped.at[idx, 'Hasil_uji'] = 'Ya' if p_value_shapiro < 0.05 else 'Tidak'
                grouped.at[idx, 'Deskripsi_Pengujian_Statistik'] = f"Material dengan kode {row['Material_Code']} telah dilakukan pengujian statistik dengan metode Uji Normal Shapiro Wilk Test dengan Tingkat Signifikansi 5%. {'Berhasil' if p_value_shapiro < 0.05 else 'Tidak Berhasil'} menolak Hypotesis Null."

                if grouped.at[idx, 'Hasil_uji'] == 'Tidak':
                    grouped.at[idx, 'Proses2'] = 'MN'
                    continue

                # Uji Kolmogorov-Smirnov pada alpha 5%
                stat, p_value_ks = kstest(material_data, 'norm', args=(material_data.mean(), material_data.std()))
                grouped.at[idx, 'P_Value'] = p_value_ks
                grouped.at[idx, 'Hasil_uji'] = 'Ya' if p_value_ks < 0.05 else 'Tidak'
                grouped.at[idx, 'Deskripsi_Pengujian_Statistik'] = f"Material dengan kode {row['Material_Code']} telah dilakukan pengujian statistik dengan metode Uji Normal Kolmogorov-Smirnov Test dengan Tingkat Signifikansi 5%. {'Berhasil' if p_value_ks < 0.05 else 'Tidak Berhasil'} menolak Hypotesis Null."

                if grouped.at[idx, 'Hasil_uji'] == 'Tidak':
                    grouped.at[idx, 'Proses2'] = 'MN'
                else:
                    grouped.at[idx, 'Proses2'] = 'MT'

            elif row['Proses1'] == 'PP' and row['Proses2'] is None:
                if row['Jumlah_Data'] == 1:
                    grouped.at[idx, 'Proses2'] = 'MT'
                    continue  # Langsung skip untuk uji distribusi poisson

                # Uji Distribusi Poisson
                nilai, hitung = np.unique(material_data, return_counts=True)
                rata_rata_data = material_data.mean()
                frekuensi_diharapkan = [poisson.pmf(k, rata_rata_data) * len(material_data) for k in nilai]

                # Uji Distribusi Poisson
                nilai, hitung = np.unique(material_data, return_counts=True)
                rata_rata_data = material_data.mean()
                frekuensi_diharapkan = [poisson.pmf(k, rata_rata_data) * len(material_data) for k in nilai]

                scaling_factor = 1 if np.sum(frekuensi_diharapkan) == 0 or np.sum(hitung) == 0 else np.sum(hitung) / np.sum(frekuensi_diharapkan)
                frekuensi_diharapkan = [f * scaling_factor for f in frekuensi_diharapkan]

                # if np.sum(frekuensi_diharapkan) == 0 or np.sum(hitung) == 0:
                #     grouped.at[idx, 'Hasil_uji'] = 'Tidak dapat diuji dengan Poisson'
                #     grouped.at[idx, 'Proses2'] = 'MT'
                #     continue

                # scaling_factor = np.sum(hitung) / np.sum(frekuensi_diharapkan)
                # frekuensi_diharapkan = [f * scaling_factor for f in frekuensi_diharapkan]

                try:
                    stat, p_value_poiss = chisquare(hitung, frekuensi_diharapkan)
                    grouped.at[idx, 'P_Value'] = p_value_poiss
                    grouped.at[idx, 'Hasil_uji'] = 'Ya' if p_value_poiss < 0.1 else 'Tidak'
                    grouped.at[idx, 'Deskripsi_Pengujian_Statistik'] = f"Material dengan kode {row['Material_Code']} telah dilakukan pengujian statistik dengan metode Uji Poisson Test dengan Tingkat Signifikansi 5%. {'Berhasil' if p_value_poiss < 0.1 else 'Tidak Berhasil'} menolak Hypotesis Null."
                except ValueError as e:
                    grouped.at[idx, 'Hasil_uji'] = 'Hasil pengujian menunjukan pola distribusi tak tentu'
                    grouped.at[idx, 'Proses2'] = 'MT'
                    continue

                if grouped.at[idx, 'Hasil_uji'] == 'Tidak':
                    grouped.at[idx, 'Proses2'] = 'MP'
                else:
                    grouped.at[idx, 'Proses2'] = 'MT'

    grouped['Kategori'] = grouped.apply(lambda row: 
        'Pola Deterministik' if row['Proses2'] == 'MD' else 
        'Pola Normal' if row['Proses2'] == 'MN' else 
        'Pola Poisson' if row['Proses2'] == 'MP' else 
        'Pola Non Moving' if row['Proses1'] == 'PT' else 
        'Pola Tak - Tentu' if row['Proses2'] == 'MT' else None, 
        axis=1)

    # Mengatur ulang urutan kolom
    ordered_columns = ['Material_Code', 'Kategori', 'Proses1', 'Proses2', 'Jumlah_Data', 'Rata_Rata', 'Variansi', 'Standar_Deviasi', 'P_Value', 'Deskripsi_Pengujian_Statistik', 'Hasil_uji']
    grouped = grouped[ordered_columns]

    return grouped

# function proses classification dataframe
def processing_classification(data):
    try:
        filtered_df = data
        filtered_df['Has_Z61'] = filtered_df['Movement Type'] == 'Z61'
        Hasil_Klasifikasi = count_and_stats_by_material(filtered_df)
        filtered_df_unique = filtered_df[['Material_Code', 'Material Description']].drop_duplicates(subset='Material_Code')
        Hasil_Klasifikasi = Hasil_Klasifikasi.merge(filtered_df_unique, how='left', left_on='Material_Code', right_on='Material_Code')
        cols = list(Hasil_Klasifikasi.columns)
        material_code_index = cols.index('Material_Code')
        cols.insert(material_code_index + 1, cols.pop(cols.index('Material Description')))
        Hasil_Klasifikasi = Hasil_Klasifikasi[cols]
        # start contoh non moving
        data_contoh = {
            "Material_Code": [6002804, 6056981, 6056983],
            "Material Description": ["Desc4", "Desc5", "Desc6"],
            "Jumlah_Data": [25, 30, 35],
            "Kategori": ["Pola Non Moving", "Pola Non Moving", "Pola Non Moving"],
            "Proses1": ["PT", "PT", "PT"],
            "Proses2": ["MD", "MD", "MD"],
            "P_Value": [0.15, 0.25, 0.05],
            "Variansi": [1.4, 1.6, 1.3],
            "Rata_Rata": [15.5, 16.8, 14.9],
            "Standar_Deviasi": [0.8, 0.9, 0.7],
            "Hasil_uji": [None, None, None],
            "Deskripsi_Pengujian_Statistik": ["Test4", "Test5", "Test6"]
        }
        df_baru = pd.DataFrame(data_contoh)
        Hasil_Klasifikasi = pd.concat([Hasil_Klasifikasi, df_baru], ignore_index=True)

        # end contoh non mocing
        return Hasil_Klasifikasi
    except KeyError as e:
        print(f"proses klasifikasi keyerror: {e}")
        return e

    except Exception as e:
        print(f"proses klasifikasi error: {e}")
        return e

# proses deterministik
def deterministrik_model(deterministik_array):
    material_code_list = []
    for index, item in enumerate(deterministik_array):
        material_code_list.append(item["Material_Code"])

    result_deterministik = []
    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(deterministik_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')
    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"Rata_Rata": "Permintaan Barang (D) Unit/Tahun"})
    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})
    merged_df = merged_df.rename(columns={"lead_time": "Estimasi Lead Time (Mon)"})

    merged_df['Estimasi Lead Time (Mon)'] = pd.to_numeric(merged_df['Estimasi Lead Time (Mon)'], errors='coerce')
    merged_df.loc[:, 'Lead Time (L) Tahun'] = merged_df['Estimasi Lead Time (Mon)'] / 12

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Ongkos Pesan (A) /Pesan'] = merged_df['Harga Barang (p) /Unit'].apply(lambda x: 5000000 if x > 100000000 else 1000000)

    merged_df.loc[:, 'Ongkos Simpan (h) /Unit/Tahun'] = merged_df['Harga Barang (p) /Unit'] * 0.15
    for index, row in merged_df.iterrows():
        permintaan_barang = float(row["Permintaan Barang (D) Unit/Tahun"]) if not pd.isna(row["Permintaan Barang (D) Unit/Tahun"]) else 0
        harga_barang = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        ongkos_pesan = int(row["Ongkos Pesan (A) /Pesan"]) if not pd.isna(row["Ongkos Pesan (A) /Pesan"]) else 0
        lead_time = float(row["Lead Time (L) Tahun"]) if not pd.isna(row["Lead Time (L) Tahun"]) else 0.0
        ongkos_simpan = float(row["Ongkos Simpan (h) /Unit/Tahun"]) if not pd.isna(row["Ongkos Simpan (h) /Unit/Tahun"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_deterministik.append(calc.Model_Wilson(permintaan_barang,harga_barang, ongkos_pesan, lead_time, ongkos_simpan, material_code,material_description,abc_indikator))

        except Exception as e:
            result_deterministik.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Permintaan Barang (D) Unit/Tahun": permintaan_barang,
                "Harga Barang (p) /Unit": harga_barang,
                "Ongkos Pesan (A) /Pesan": ongkos_pesan,
                "Lead Time (L) Tahun": lead_time,
                "Ongkos Simpan (h) /Unit/Tahun": ongkos_simpan,
                "Lot Pengadaan (EOQ) Unit/Pesanan": "",
                "Reorder Point (ROP) Unit": "",
                "Selang Waktu Pesan Kembali (Tahun)": "",
                "Selang Waktu Pesan Kembali (Bulan)": "",
                "Selang Waktu Pesan Kembali (Hari)": "",
                "Frequensi Pemesanan (f)": "",
                "Ongkos Pembelian (Ob) /Tahun": "",
                "Ongkos Pemesanan (Op) /Tahun": "",
                "Ongkos Penyimpanan (Os) /Tahun": "",
                "Ongkos Inventori (OT) /Tahun": ""
            })

    return result_deterministik

# proses normal
def normal_model(normal_array):
    material_code_list = []
    for index, item in enumerate(normal_array):
        material_code_list.append(item["Material_Code"])

    result_normal = []

    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(normal_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')

    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"Rata_Rata": "Rata - Rata Permintaan Barang (D) Unit/Tahun"})
    merged_df = merged_df.rename(columns={"Standar_Deviasi": "Standar Deviasi Permintaan Barang (s) Unit/Tahun"})
    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Ongkos Pesan (A) /Pesan'] = merged_df['Harga Barang (p) /Unit'].apply(lambda x: 5000000 if x > 100000000 else 1000000)

    merged_df = merged_df.rename(columns={"lead_time": "Estimasi Lead Time (Mon)"})
    merged_df['Estimasi Lead Time (Mon)'] = pd.to_numeric(merged_df['Estimasi Lead Time (Mon)'], errors='coerce')
    merged_df.loc[:, 'Lead Time (L) Tahun'] = merged_df['Estimasi Lead Time (Mon)'] / 12

    merged_df.loc[:, 'Ongkos Simpan (h) /Unit/Tahun'] = merged_df['Harga Barang (p) /Unit'] * 0.15

    merged_df.loc[:, 'Ongkos Kekurangan Inventori (Cu) /Unit/Tahun'] = 3720000000

    for index, row in merged_df.iterrows():
        rata_rata_permintaan_barang = float(row["Rata - Rata Permintaan Barang (D) Unit/Tahun"]) if not pd.isna(row["Rata - Rata Permintaan Barang (D) Unit/Tahun"]) else 0
        lead_time = float(row["Lead Time (L) Tahun"]) if not pd.isna(row["Lead Time (L) Tahun"]) else 0.0
        standar_deviasi = float(row["Standar Deviasi Permintaan Barang (s) Unit/Tahun"]) if not pd.isna(row["Standar Deviasi Permintaan Barang (s) Unit/Tahun"]) else 0
        ongkos_pesan = int(row["Ongkos Pesan (A) /Pesan"]) if not pd.isna(row["Ongkos Pesan (A) /Pesan"]) else 0
        harga_barang = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        ongkos_simpan = float(row["Ongkos Simpan (h) /Unit/Tahun"]) if not pd.isna(row["Ongkos Simpan (h) /Unit/Tahun"]) else 0
        ongkos_kekurangan_inventori_setiap_unit_barang = int(row["Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"]) if not pd.isna(row["Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_normal.append(calc.Model_Q(rata_rata_permintaan_barang , lead_time, standar_deviasi, ongkos_pesan ,harga_barang,ongkos_simpan, ongkos_kekurangan_inventori_setiap_unit_barang,material_code,material_description,abc_indikator))

        except Exception as e:
            result_normal.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Rata - Rata Permintaan Barang (D) Unit/Tahun": rata_rata_permintaan_barang,
                "Standar Deviasi Permintaan Barang (s) Unit/Tahun": standar_deviasi,
                "Lead Time (L) Tahun": lead_time,
                "Ongkos Pesan (A) /Pesan": ongkos_pesan,
                "Harga Barang (p) /Unit": harga_barang,
                "Ongkos Simpan (h) /Unit/Tahun": ongkos_simpan,
                "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun": ongkos_kekurangan_inventori_setiap_unit_barang,
                "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun": "",
                "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun": "",
                "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan": "",
                "Reorder Point (ROP) Unit": "",
                "Safety Stock (SS) Unit": "",
                "Frequensi Pemesanan (f)": "",
                "Ongkos Pembelian (Ob) /Tahun": "",
                "Ongkos Pemesanan (Op) /Tahun": "",
                "Ongkos Penyimpanan (Os) /Tahun": "",
                "Ongkos Kekurangan Inventori (Ok) /Tahun": "",
                "Ongkos Inventori (OT) /Tahun": ""
            })

    return result_normal

# proes poisson
def poisson_model(poisson_array):
    # ambil list material code
    material_code_list = []
    for index, item in enumerate(poisson_array): material_code_list.append(item["Material_Code"])

    # ambil data dari database
    product = db.get_product_model(material_code_list)
    if product[0] == "failed": return

    # gabungkan data
    df_array = pd.DataFrame(poisson_array)
    df_database = pd.DataFrame(product[1])
    df_array['Material_Code'] = df_array['Material_Code'].astype(str)
    df_database['material_code'] = df_database['material_code'].astype(str)
    df = pd.merge(df_array, df_database, left_on="Material_Code", right_on="material_code", how="left")

    # identifikasi input
    df['harga_barang'] = pd.to_numeric(df['price'], errors='coerce')
    df.loc[:, 'ongkos_pesan'] = df['harga_barang'].apply(lambda x: 5000000 if x > 100000000 else 1000000)
    df.loc[:, 'ongkos_simpan'] = df['harga_barang'] * 0.15
    df.loc[:, 'ongkos_kekurangan'] = 3720000000
    df = df.rename(columns={'Rata_Rata': 'rata_rata_permintaan'})
    df = df.rename(columns={"Standar_Deviasi": "standar_deviasi"})
    df['lead_time'] = pd.to_numeric(df['lead_time'], errors='coerce') / 12

    result_poisson = []

    # hitung semua data
    def process_row(row):
        code = row['Material_Code']
        description = row['Material Description']
        indicator = row['indicator']
        harga_barang = int(row["harga_barang"]) if not pd.isna(row["harga_barang"]) else 0
        ongkos_pesan = int(row["ongkos_simpan"]) if not pd.isna(row["ongkos_simpan"]) else 0
        ongkos_simpan = float(row["ongkos_simpan"]) if not pd.isna(row["ongkos_simpan"]) else 0
        ongkos_kekurangan = int(row["ongkos_kekurangan"]) if not pd.isna(row["ongkos_kekurangan"]) else 0
        rata_rata_permintaan = float(row["rata_rata_permintaan"]) if not pd.isna(row["rata_rata_permintaan"]) else 0
        standar_deviasi = float(row["standar_deviasi"]) if not pd.isna(row["standar_deviasi"]) else 0
        lead_time = float(row["lead_time"]) if not pd.isna(row["lead_time"]) else 0.0

        return_null = {
            'Material Code': code,
            'Material Description': description,
            'ABC Indicator': indicator,
            'Harga Barang Rp/Unit (p)': harga_barang,
            'Ongkos Pesan Rp/Pesan (A)': ongkos_pesan,
            'Ongkos Simpan Rp/Unit/Tahun (h)': ongkos_simpan,
            'Ongkos Kekurangan Rp/Unit (Cu)': ongkos_kekurangan,
            'Rata-Rata Permintaan Unit/Tahun (D)': rata_rata_permintaan,
            'Standar Deviasi Permintaan Unit/Tahun (S)': standar_deviasi,
            'Lead Time /tahun (L)': lead_time,
            'Iterasi': "",
            'Nilai Alpha (a)': "",
            'Standar Deviasi Waktu Ancang-ancang Unit/Tahun (SL)': "",
            'Economic Order Quantity (EOQ)': "",
            'Reorder Point /Unit (ROP)':"",
            'Safety Stock /Unit (SS)': "",
            'Ongkos Inventori /Tahun (OT)': "",
            'Tingkat pelayanan % (n)': ""
        }

        if harga_barang == 0: return return_null
        try: return calc.model_poisson(code, description, indicator, harga_barang, ongkos_pesan, ongkos_simpan, ongkos_kekurangan, rata_rata_permintaan, standar_deviasi, lead_time)
        except Exception as e: return return_null

    result_poisson = df.apply(process_row, axis=1).tolist()
    return result_poisson

# proes tak tentu
def taktentu_model(taktentu_array):
    material_code_list = []
    for index, item in enumerate(taktentu_array):
        material_code_list.append(item["Material_Code"])

    result_taktentu = []

    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(taktentu_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')

    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"Rata_Rata": "Rata - Rata Permintaan Barang (alpha)"})
    merged_df = merged_df.rename(columns={"Standar_Deviasi": "Standar Deviasi Permintaan Barang (s)"})
    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Kerugian Ketidakadaan Barang (Cu) /Unit'] = 3720000000

    for index, row in merged_df.iterrows():
        harga_barang = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        kerugian_ketidakadaan_barang = int(row["Kerugian Ketidakadaan Barang (Cu) /Unit"]) if not pd.isna(row["Kerugian Ketidakadaan Barang (Cu) /Unit"]) else 0
        standar_deviasi = float(row["Standar Deviasi Permintaan Barang (s)"]) if not pd.isna(row["Standar Deviasi Permintaan Barang (s)"]) else 0
        rata_rata_permintaan_barang = float(row["Rata - Rata Permintaan Barang (alpha)"]) if not pd.isna(row["Rata - Rata Permintaan Barang (alpha)"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_taktentu.append(calc.Model_Tchebycheff_TakTentu(harga_barang, kerugian_ketidakadaan_barang, standar_deviasi, rata_rata_permintaan_barang, material_code,material_description,abc_indikator))

        except Exception as e:
            result_taktentu.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Harga Barang (p) /Unit": harga_barang,
                "Kerugian Ketidakadaan Barang (Cu) /Unit": kerugian_ketidakadaan_barang,
                "Standar Deviasi Permintaan Barang (s)": standar_deviasi,
                "Rata - Rata Permintaan Barang (alpha)": rata_rata_permintaan_barang,
                "Nilai K Model Tchebycheff": "",
                "Lot Pemesanan Optimal (q0)": ""
            })

    return result_taktentu

# non moving regret
def non_moving_regret(nonmoving_array):
    material_code_list = []
    for index, item in enumerate(nonmoving_array):
        material_code_list.append(item["Material_Code"])

    result_nonmoving = []

    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(nonmoving_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')

    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Stock Out Effect'] = 3720000000
    merged_df.loc[:, 'Jumlah Komponen Terpasang'] = 5

    for index, row in merged_df.iterrows():
        ongkos_pemakaian_komponen = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        ongkos_kerugian_akibat_kerusakan = float(row["Stock Out Effect"]) if not pd.isna(row["Stock Out Effect"]) else 0
        jumlah_komponen_terpasang = int(row["Jumlah Komponen Terpasang"]) if not pd.isna(row["Jumlah Komponen Terpasang"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_nonmoving.append(calc.Model_MinMaxRegret(ongkos_pemakaian_komponen, ongkos_kerugian_akibat_kerusakan, jumlah_komponen_terpasang, material_code, material_description, abc_indikator))

        except Exception as e:
            result_nonmoving.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Ongkos Pemakaian Komponen (H)": ongkos_pemakaian_komponen,
                "Ongkos Kerugian Akibat Kerusakan (L)": ongkos_kerugian_akibat_kerusakan,
                "Jumlah Komponen Terpasang (m)": jumlah_komponen_terpasang,
                "Minimum Regret (Rp )": "",
                "Harga Resale Komponen (O)": "",
                "Strategi Penyediaan Optimal (Unit)": "",
            })

    return result_nonmoving

# non moving linear
def non_moving_linear(nonmoving_array):
    material_code_list = []
    for index, item in enumerate(nonmoving_array):
        material_code_list.append(item["Material_Code"])

    result_nonmoving = []

    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(nonmoving_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')

    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Stock Out Effect'] = 3720000000
    merged_df.loc[:, 'Jumlah Komponen Terpasang'] = 5

    for index, row in merged_df.iterrows():
        ongkos_pemakaian_komponen = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        ongkos_kerugian_akibat_kerusakan = float(row["Stock Out Effect"]) if not pd.isna(row["Stock Out Effect"]) else 0
        jumlah_komponen_terpasang = int(row["Jumlah Komponen Terpasang"]) if not pd.isna(row["Jumlah Komponen Terpasang"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_nonmoving.append(calc.model_kerusakan_linear(ongkos_pemakaian_komponen, ongkos_kerugian_akibat_kerusakan, jumlah_komponen_terpasang, material_code, material_description, abc_indikator))

        except Exception as e:
            result_nonmoving.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Ongkos Pemakaian Komponen (H)": ongkos_pemakaian_komponen,
                "Ongkos Kerugian Akibat Kerusakan (L)": ongkos_kerugian_akibat_kerusakan,
                "Jumlah Komponen Terpasang (m)": jumlah_komponen_terpasang,
                "Minimum Regret (Rp )": "",
                "Harga Resale Komponen (O)": "",
                "Strategi Penyediaan Optimal (Unit)": "",
            })

    return result_nonmoving

# non moving regret
def non_moving_non_linear(nonmoving_array):
    material_code_list = []
    for index, item in enumerate(nonmoving_array):
        material_code_list.append(item["Material_Code"])

    result_nonmoving = []

    product = db.get_product_model(material_code_list)

    if product[0] == "failed": return

    df1 = pd.DataFrame(nonmoving_array)
    df2 = pd.DataFrame(product[1])

    df1['Material_Code'] = df1['Material_Code'].astype(str)
    df2['material_code'] = df2['material_code'].astype(str)

    df2_clean = df2.drop_duplicates(subset='material_code')

    merged_df = pd.merge(df1, df2_clean, left_on="Material_Code", right_on="material_code", how="left")

    merged_df = merged_df.rename(columns={"price": "Harga Barang (p) /Unit"})
    merged_df = merged_df.rename(columns={'indicator': "ABC Indicator"})

    merged_df['Harga Barang (p) /Unit'] = pd.to_numeric(merged_df['Harga Barang (p) /Unit'], errors='coerce')
    merged_df.loc[:, 'Stock Out Effect'] = 3720000000
    merged_df.loc[:, 'Jumlah Komponen Terpasang'] = 5

    for index, row in merged_df.iterrows():
        ongkos_pemakaian_komponen = int(row["Harga Barang (p) /Unit"]) if not pd.isna(row["Harga Barang (p) /Unit"]) else 0
        ongkos_kerugian_akibat_kerusakan = float(row["Stock Out Effect"]) if not pd.isna(row["Stock Out Effect"]) else 0
        jumlah_komponen_terpasang = int(row["Jumlah Komponen Terpasang"]) if not pd.isna(row["Jumlah Komponen Terpasang"]) else 0
        material_code = row["Material_Code"]
        material_description = row["Material Description"]
        abc_indikator = row["ABC Indicator"]

        try:
            result_nonmoving.append(calc.model_kerusakan_non_linear(ongkos_pemakaian_komponen, ongkos_kerugian_akibat_kerusakan, jumlah_komponen_terpasang, material_code, material_description, abc_indikator))

        except Exception as e:
            result_nonmoving.append({
                "Material Code": material_code,
                "Material Description": material_description,
                "ABC Indicator": abc_indikator,
                "Ongkos Pemakaian Komponen (H)": ongkos_pemakaian_komponen,
                "Ongkos Kerugian Akibat Kerusakan (L)": ongkos_kerugian_akibat_kerusakan,
                "Jumlah Komponen Terpasang (m)": jumlah_komponen_terpasang,
                "Minimum Regret (Rp )": "",
                "Harga Resale Komponen (O)": "",
                "Strategi Penyediaan Optimal (Unit)": "",
            })

    return result_nonmoving

# bcr
def bcr_model(bcr_array):
    # ambil list material code
    material_code_list = []
    for index, item in enumerate(bcr_array): material_code_list.append(item["Material_Code"])

    # ambil data dari database
    product = db.get_product_model(material_code_list)
    if product[0] == "failed": return

    # gabungkan data
    df_array= pd.DataFrame(bcr_array)
    df_database = pd.DataFrame(product[1])
    df_array['Material_Code'] = df_array['Material_Code'].astype(str)
    df_database['material_code'] = df_database['material_code'].astype(str)
    df = pd.merge(df_array, df_database, left_on="Material_Code", right_on="material_code", how="left")

    # identifikasi input
    df['harga_komponen'] = pd.to_numeric(df['price'], errors='coerce')
    df.loc[:, 'kerugian_komponen'] = 3720000000
    df.loc[:, 'suku_bunga'] = 10
    df.loc[:, 'sisa_operasi'] = 5
    probabilitas_options = ['uniform', 'linear', 'hiperbolik', 'kuadratis', 'kubik']
    df['probabilitas'] = [random.choice(probabilitas_options) for _ in range(len(df))]

    result_bcr = []

    # hitung semua data
    def process_row(row):
        code = row['Material_Code']
        description = row['Material Description']
        indicator = row['indicator']
        harga_komponen = int(row['harga_komponen']) if not pd.isna(row['harga_komponen']) else 0
        kerugian_komponen = int(row['kerugian_komponen']) if not pd.isna(row['kerugian_komponen']) else 0
        suku_bunga = float(row['suku_bunga']) if not pd.isna(row['suku_bunga']) else 0
        sisa_operasi = int(row['sisa_operasi']) if not pd.isna(row['sisa_operasi']) else 0
        probabilitas = row['probabilitas']

        return_null = {
            'Material Code': code,
            'Material Description': description,
            'ABC Indicator': indicator,
            'Harga Komponen /Unit (Ho)': harga_komponen,
            'Kerugian Komponen /Unit (Co)': kerugian_komponen,
            'Suku Bunga /Tahun (i)': suku_bunga,
            'Sisa Operasi /Tahun (N)' :sisa_operasi,
            'Pola Probabilitas (P)': probabilitas,
            'Ongkos Pemakaian /Unit (Ht)': "",
            'Kerugian Komponen /Unit (Ct)': "",
            'Probabilitas Kerusakan P(t)': "",
            'Ekspektasi Benefit (Bt)': "",
            'Benefit Cost Ration': "",
            'Remark': ''
        }

        if harga_komponen == 0: return return_null
        try: return calc.model_benefit_cost_ratio(code, description, indicator, harga_komponen, kerugian_komponen, suku_bunga, sisa_operasi, probabilitas)
        except Exception as e: return return_null

    result_bcr = df.apply(process_row, axis=1).tolist()
    return result_bcr

# proses classification model
def processing_model(dataframe):
    df = dataframe
    # df = pd.read_excel("./app/Hasil_Klasifikasi.xlsx", engine="openpyxl")

    kategori_list = [ "Pola Deterministik", "Pola Normal", "Pola Poisson", "Pola Tak - Tentu", "Pola Non Moving" ]

    result = {}

    for kategori in kategori_list: result[kategori] = df[df['Kategori'] == kategori].to_dict(orient='records')
    result["BCR"] = sum(result.values(), [])

    poisson_array = result["Pola Poisson"]
    result_poisson = []
    if len(poisson_array) != 0: result_poisson = poisson_model(poisson_array)

    bcr_array = result["BCR"]
    result_bcr = []
    if len(bcr_array) != 0: result_bcr = bcr_model(bcr_array)

    deterministik_array = result["Pola Deterministik"]
    result_deterministik = []
    if len(deterministik_array) != 0:
        result_deterministik = deterministrik_model(deterministik_array)

    normal_array = result["Pola Normal"]
    result_normal = []
    if len(normal_array) != 0:
        result_normal = normal_model(normal_array)

    taktentu_array = result["Pola Tak - Tentu"]
    result_taktentu = []
    if len(taktentu_array) != 0:
        result_taktentu = taktentu_model(taktentu_array)

    nonmoving_array = result["Pola Non Moving"]

    result_nonmovingregret = []
    if len(nonmoving_array) != 0:
        result_nonmovingregret = non_moving_regret(nonmoving_array)

    result_nonmovinglinear = []
    if len(nonmoving_array) != 0:
        result_nonmovinglinear = non_moving_linear(nonmoving_array)

    result_nonmovingnonlinear = []
    if len(nonmoving_array) != 0:
        result_nonmovingnonlinear = non_moving_non_linear(nonmoving_array)

    results = {
        "wilson": result_deterministik,
        "q": result_normal,
        "poisson": result_poisson,
        "tchebycheff": result_taktentu,
        "nonmovingregret": result_nonmovingregret,
        "nonmovinglinear": result_nonmovinglinear,
        "nonmovingnonlinear": result_nonmovingnonlinear,
        "bcr": result_bcr,
    }

    for key in results:
        df = pd.DataFrame(results[key])
        df = df.fillna("")
        results[key] = df.to_dict(orient='records')

    return results
