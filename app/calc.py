import pandas as pd
import numpy as np
import math
from scipy.stats import norm, poisson
from itertools import accumulate, count

# Model Inventori Probabilistik Normal– Model Q
def Model_Q(
        Rata_Rata_Permintaan_Barang_ModelQ_D,
        Lead_Time_ModelQ_L, 
        Standar_Deviasi_Permintaan_Barang_ModelQ_S, 
        Ongkos_Pesan_ModelQ_A,
        Harga_barang_ModelQ_p,
        Ongkos_Simpan_ModelQ_h, 
        Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu,
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None
    ):

    # Hitung Nilai Standar Deviasi Permintaan Barang waktu LeadTime
    Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL = Standar_Deviasi_Permintaan_Barang_ModelQ_S * math.sqrt(Lead_Time_ModelQ_L) #Unit/Tahun

    # 1. Hitung Lot Pengadaaan barang sebesar qo1* inisiasi dengan Metode Hadley-Within:
    Lot_Pengadaan_barang_ModelQ_qo1 = math.sqrt(2*Ongkos_Pesan_ModelQ_A*Rata_Rata_Permintaan_Barang_ModelQ_D/Ongkos_Simpan_ModelQ_h)

    # Hitung nilai Alpha Inisiasi
    alpha_ModelQ_inisiasi = Ongkos_Simpan_ModelQ_h*Lot_Pengadaan_barang_ModelQ_qo1/(Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu*Rata_Rata_Permintaan_Barang_ModelQ_D)
    za_one_tailed_ModelQ_Inisiasi = norm.ppf(1 - alpha_ModelQ_inisiasi)

    # DL = D * L
    Rata_Rata_Permintaan_Barang_ModelQ_WaktuLeadTime_DL = Rata_Rata_Permintaan_Barang_ModelQ_D*Lead_Time_ModelQ_L

    # Hitung Nilai Reorder Point (r1*)
    # Za = (r1* - DL)/SL
    # r1* = (Za*SL) + DL
    Reorder_Point_ModelQ_r1 = (za_one_tailed_ModelQ_Inisiasi*Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL) + Rata_Rata_Permintaan_Barang_ModelQ_WaktuLeadTime_DL

    # Hitung distribusi Normal Standar ϕ(z)
    Fungsi_Distribusi_Normal_ModelQ_F_Za = norm.pdf(za_one_tailed_ModelQ_Inisiasi)

    #Hitung Standar Normal Loss L(z)=ϕ(z)−z(1−Φ(z))

    #Hitung kumulatif Normal Distribusi φ(z)
    Fungsi_Kumulatif_Distribusi_Normal_ModelQ_phi_Za = norm.cdf(za_one_tailed_ModelQ_Inisiasi)

    # Hitung Standar Normal Loss L(z)
    Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za = Fungsi_Distribusi_Normal_ModelQ_F_Za - za_one_tailed_ModelQ_Inisiasi * (1- Fungsi_Kumulatif_Distribusi_Normal_ModelQ_phi_Za)
    Jumlah_Kekurangan_Barang_N = Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL * (Fungsi_Distribusi_Normal_ModelQ_F_Za - (za_one_tailed_ModelQ_Inisiasi * Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za))
    print(Jumlah_Kekurangan_Barang_N)
    # Hitung Nilai Lot Pengadaan barang (qo2*)
    iterasi_ModelQ_i = 0
    Jumlah_Kekurangan_Barang_NT = Jumlah_Kekurangan_Barang_N
    Fungsi_Distribusi_Normal_ModelQ_F_Za2 = Fungsi_Distribusi_Normal_ModelQ_F_Za
    Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za2 = Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za
    Reorder_Point_ModelQ_r2 = Reorder_Point_ModelQ_r1

    while True:
        # Hitung EOQ (Economic Order Quantity)
        Lot_Pengadaan_barang_ModelQ_qo2 = math.sqrt(2 * Rata_Rata_Permintaan_Barang_ModelQ_D *(Ongkos_Pesan_ModelQ_A + (Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu * Jumlah_Kekurangan_Barang_NT)) / Ongkos_Simpan_ModelQ_h)
        # Hitung alpha untuk menentukan za
        alpha_ModelQ_alpha2 = (Ongkos_Simpan_ModelQ_h * Lot_Pengadaan_barang_ModelQ_qo2) / (Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu * Rata_Rata_Permintaan_Barang_ModelQ_D)
        # Hitung nilai Za
        za_one_tailed_ModelQ_Za2 = norm.ppf(1 - alpha_ModelQ_alpha2)

        # Hitung Reorder Point (ROP)
        Reorder_Point_ModelQ_r2 = Rata_Rata_Permintaan_Barang_ModelQ_WaktuLeadTime_DL + (za_one_tailed_ModelQ_Za2 * Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL)

        # Hitung distribusi Normal Standar ϕ(z)
        Fungsi_Distribusi_Normal_ModelQ_F_Za2 = norm.pdf(za_one_tailed_ModelQ_Za2)

        #Hitung kumulatif Normal Distribusi φ(z)
        Fungsi_Kumulatif_Distribusi_Normal_ModelQ_phi_Za2 = norm.cdf(za_one_tailed_ModelQ_Za2)

        # Hitung Standar Normal Loss φ(z_alpha)
        Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za2 = Fungsi_Distribusi_Normal_ModelQ_F_Za2 - za_one_tailed_ModelQ_Za2 * (1- Fungsi_Kumulatif_Distribusi_Normal_ModelQ_phi_Za2)
        Jumlah_Kekurangan_Barang_NT = Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL * (Fungsi_Distribusi_Normal_ModelQ_F_Za2 - (za_one_tailed_ModelQ_Za2 * Fungsi_Standar_Loss_Distribusi_Normal_ModelQ_phi_Za2))

        # Cek konvergensi
        if (Reorder_Point_ModelQ_r2 - Reorder_Point_ModelQ_r1) < 1:
            Reorder_Point_ModelQ_r1 = Reorder_Point_ModelQ_r2
            # print(f"Selisih Nilai reorder point r1* (Reorder Point Inisiasi) dengan Nilai reorder point r2 pada Iterasi ke-{iterasi_ModelQ_i} adalah {Reorder_Point_ModelQ_r2 - Reorder_Point_ModelQ_r1:.0f} Unit")
            break

        # Update nilai r1 dan iterasi
        iterasi_ModelQ_i += 1

    # Hitung Nilai Safety Stock (SS)
    Safety_Stocks_ModelQ_SS = za_one_tailed_ModelQ_Za2 * Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL

    # Hitung Nilai Ekspetasi Ongkos Inventori Total per Tahun

    # Hitung Ongkos Pembelian (Ob)
    Ongkos_Pembelian_ModelQ_Ob = Rata_Rata_Permintaan_Barang_ModelQ_D*Harga_barang_ModelQ_p

    # Hitung Ongkos Pengadaan (Op)
    frequensi_Pemesanan_ModelQ_f = Rata_Rata_Permintaan_Barang_ModelQ_D/Lot_Pengadaan_barang_ModelQ_qo2
    Ongkos_Pengadaan_ModelQ_Op = frequensi_Pemesanan_ModelQ_f*Ongkos_Pesan_ModelQ_A

    # Hitung Ongkos Simpan (Os)
    Ongkos_Penyimpanan_ModelQ_Os = Ongkos_Simpan_ModelQ_h*(0.5*Lot_Pengadaan_barang_ModelQ_qo2 + Reorder_Point_ModelQ_r2 - Rata_Rata_Permintaan_Barang_ModelQ_WaktuLeadTime_DL)

    # Hitung Ongkos Kekurangan Inventori (Ok)
    Ongkos_Kekurangan_Inventori_ModelQ_Ok = Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu*Jumlah_Kekurangan_Barang_NT

    Ongkos_Inventori_ModelQ_OT = Ongkos_Pembelian_ModelQ_Ob + Ongkos_Pengadaan_ModelQ_Op + Ongkos_Penyimpanan_ModelQ_Os + Ongkos_Kekurangan_Inventori_ModelQ_Ok

    hasil_Model_Q = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Rata - Rata Permintaan Barang (D) Unit/Tahun": Rata_Rata_Permintaan_Barang_ModelQ_D,
        "Standar Deviasi Permintaan Barang (s) Unit/Tahun": Standar_Deviasi_Permintaan_Barang_ModelQ_S,
        "Lead Time (L) Tahun": Lead_Time_ModelQ_L,
        "Ongkos Pesan (A) /Pesan": Ongkos_Pesan_ModelQ_A,
        "Harga Barang (p) /Unit": Harga_barang_ModelQ_p,
        "Ongkos Simpan (h) /Unit/Tahun": Ongkos_Simpan_ModelQ_h,
        "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun": Ongkos_kekurangan_inventori_setiap_unit_barang_ModelQ_Cu,
        "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun": Standar_Deviasi_Permintaan_Barang_Waktu_LeadTime_ModelQ_SL,
        "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun": Rata_Rata_Permintaan_Barang_ModelQ_WaktuLeadTime_DL,
        "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan": Lot_Pengadaan_barang_ModelQ_qo2,
        "Reorder Point (ROP) Unit": Reorder_Point_ModelQ_r2,
        "Safety Stock (SS) Unit": Safety_Stocks_ModelQ_SS,
        "Frequensi Pemesanan (f)": frequensi_Pemesanan_ModelQ_f,
        "Ongkos Pembelian (Ob) /Tahun": Ongkos_Pembelian_ModelQ_Ob,
        "Ongkos Pemesanan (Op) /Tahun": Ongkos_Pengadaan_ModelQ_Op,
        "Ongkos Penyimpanan (Os) /Tahun": Ongkos_Penyimpanan_ModelQ_Os,
        "Ongkos Kekurangan Inventori (Ok) /Tahun": Ongkos_Kekurangan_Inventori_ModelQ_Ok,
        "Ongkos Inventori (OT) /Tahun": Ongkos_Inventori_ModelQ_OT
    }

    return hasil_Model_Q

# Model Inventori Pola Deterministik
def Model_Wilson(
        Permintaan_Barang_ModelWilson_D, 
        Harga_barang_ModelWilson_p, 
        Ongkos_Pesan_ModelWilson_A, 
        Lead_Time_ModelWilson_L, 
        Ongkos_Simpan_ModelWilson_h, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None
    ):

    # 1. Hitung Lot Pengadaaan barang untuk setiap kali pembelian (EOQ) sebesar qo:
    Lot_Pengadaan_barang_ModelWilson_qo = math.sqrt(2*Ongkos_Pesan_ModelWilson_A*Permintaan_Barang_ModelWilson_D/Ongkos_Simpan_ModelWilson_h)

    # 2. Hitung nilai Reorder Point (ROP)
    Reorder_Point_ModelWilson_r = Permintaan_Barang_ModelWilson_D * Lead_Time_ModelWilson_L
    Selang_waktu_pesan_tahun_ModelWilson_T = math.sqrt(2*Ongkos_Pesan_ModelWilson_A/(Permintaan_Barang_ModelWilson_D*Ongkos_Simpan_ModelWilson_h))
    Selang_waktu_pesan_bulan_ModelWilson_T = Selang_waktu_pesan_tahun_ModelWilson_T*12
    Selang_waktu_pesan_hari_ModelWilson_T = Selang_waktu_pesan_tahun_ModelWilson_T*365

    # 3 Hitung besar Ongkos Inventori Optimal total pertahun (OT)
    # Ongkos Inventori (OT) = Ongkos Beli (Ob) + Ongkos Pemesanan (Op) + Ongkos Simpan (Os)

    # Hitung Ongkos Pemesanan (Op)
    frequensi_Pemesanan_ModelWilson_f = Permintaan_Barang_ModelWilson_D/Lot_Pengadaan_barang_ModelWilson_qo
    Ongkos_Pemesanan_ModelWilson_Op = frequensi_Pemesanan_ModelWilson_f*Ongkos_Pesan_ModelWilson_A

    # Hitung Ongkos Penyimpanan (Os)
    Ongkos_Penyimpanan_ModelWilson_Os = 0.5*Ongkos_Simpan_ModelWilson_h*Lot_Pengadaan_barang_ModelWilson_qo

    # Hitung Ongkos Inventori Optimal
    Ongkos_Pembelian_ModelWilson_Ob = Permintaan_Barang_ModelWilson_D*Harga_barang_ModelWilson_p
    Ongkos_Inventori_ModelWilson_OT = Ongkos_Pembelian_ModelWilson_Ob + Ongkos_Pemesanan_ModelWilson_Op + Ongkos_Penyimpanan_ModelWilson_Os

    hasil = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Permintaan Barang (D) Unit/Tahun": Permintaan_Barang_ModelWilson_D,
        "Harga Barang (p) /Unit": Harga_barang_ModelWilson_p,
        "Ongkos Pesan (A) /Pesan": Ongkos_Pesan_ModelWilson_A,
        "Lead Time (L) Tahun": Lead_Time_ModelWilson_L,
        "Ongkos Simpan (h) /Unit/Tahun": Ongkos_Simpan_ModelWilson_h,
        "Lot Pengadaan (EOQ) Unit/Pesanan": Lot_Pengadaan_barang_ModelWilson_qo,
        "Reorder Point (ROP) Unit": Reorder_Point_ModelWilson_r,
        "Selang Waktu Pesan Kembali (Tahun)": Selang_waktu_pesan_tahun_ModelWilson_T,
        "Selang Waktu Pesan Kembali (Bulan)": Selang_waktu_pesan_bulan_ModelWilson_T,
        "Selang Waktu Pesan Kembali (Hari)": Selang_waktu_pesan_hari_ModelWilson_T,
        "Frequensi Pemesanan (f)": frequensi_Pemesanan_ModelWilson_f,
        "Ongkos Pembelian (Ob) /Tahun": Ongkos_Pembelian_ModelWilson_Ob,
        "Ongkos Pemesanan (Op) /Tahun": Ongkos_Pemesanan_ModelWilson_Op,
        "Ongkos Penyimpanan (Os) /Tahun": Ongkos_Penyimpanan_ModelWilson_Os,
        "Ongkos Inventori (OT) /Tahun": Ongkos_Inventori_ModelWilson_OT
    }

    return hasil

# Model Inventori Probabilistik – Model Poisson
def Model_Poisson(
        Rata_Rata_Pemesanan_Barang_ModelPoisson_D, 
        Standar_Deviasi_Barang_ModelPoisson_S, 
        Lead_Time_ModelPoisson_L, 
        Ongkos_Pesan_ModelPoisson_A, 
        Harga_Barang_ModelPoisson_p, 
        Ongkos_Simpan_ModelPoisson_h, 
        Ongkos_Kekurangan_Barang_ModelPoisson_Cu,
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None
    ):

    if MaterialCode is np.nan:
        if pd.isna(MaterialCode):
            MaterialCode = ""

    if Material_Description is np.nan:
        if pd.isna(Material_Description):
            Material_Description = ""

    if ABC_Indikator is np.nan:
        if pd.isna(ABC_Indikator):
            ABC_Indikator = ""

    Standar_Deviasi_Waktu_Ancang_Ancang_SL = Standar_Deviasi_Barang_ModelPoisson_S * math.sqrt(Lead_Time_ModelPoisson_L)
    qo_1_Awal_Poisson = math.sqrt((2 * Ongkos_Pesan_ModelPoisson_A * Rata_Rata_Pemesanan_Barang_ModelPoisson_D) / Ongkos_Simpan_ModelPoisson_h)
    # Hitung nilai alpha
    alpha_Awal_poisson = (Ongkos_Simpan_ModelPoisson_h * qo_1_Awal_Poisson) / (Ongkos_Kekurangan_Barang_ModelPoisson_Cu * Rata_Rata_Pemesanan_Barang_ModelPoisson_D)

    # Hitung rata-rata jumlah permintaan selama waktu ancang-ancang
    x_Poisson  = Rata_Rata_Pemesanan_Barang_ModelPoisson_D * Lead_Time_ModelPoisson_L
    
    # Mulai dengan nilai reorder point awal
    reorder_point_awal_Poisson = 0
    
    # Hitung nilai probabilitas P(X)
    while True:
        probabilitas_kumulatif_poisson_reorder_point = poisson.cdf(reorder_point_awal_Poisson, x_Poisson)
        
        # Tetap lakukan looping hingga 1-probabilitas_kumulatifnya <= alpha_poisson
        if 1 - probabilitas_kumulatif_poisson_reorder_point <= alpha_Awal_poisson:
            # print(f"Nilai reorder point r1* Awal Iterasi adalah {reorder_point_awal_Poisson:.0f} Unit")
            break
        reorder_point_awal_Poisson += 1
    
    # Hitung nilai Safety Stock (SS) Iterasi 1
    SS_Awal_Poisson = reorder_point_awal_Poisson - (Rata_Rata_Pemesanan_Barang_ModelPoisson_D * Lead_Time_ModelPoisson_L)
    
    # Hitung nilai awal dari Ongkos Inventori (OT)
    Ongkos_Inventori_Awal_Poisson = (
        (Rata_Rata_Pemesanan_Barang_ModelPoisson_D * Harga_Barang_ModelPoisson_p) +
        ((Ongkos_Pesan_ModelPoisson_A * Rata_Rata_Pemesanan_Barang_ModelPoisson_D) / qo_1_Awal_Poisson) +
        Ongkos_Simpan_ModelPoisson_h * (0.5 * qo_1_Awal_Poisson + SS_Awal_Poisson) +
        (Ongkos_Kekurangan_Barang_ModelPoisson_Cu * alpha_Awal_poisson * Rata_Rata_Pemesanan_Barang_ModelPoisson_D)
    )

    # Looping Perhitungan Ongkos Inventori
    alpha_poisson = alpha_Awal_poisson
    qo_1_Poisson = qo_1_Awal_Poisson
    reorder_point_Poisson = reorder_point_awal_Poisson
    iterasi = 0
    
    while True:
        iterasi += 1

        # Hitung nilai lot optimal
        qo_1_Poisson = math.sqrt(
            2 * Rata_Rata_Pemesanan_Barang_ModelPoisson_D *
            (Ongkos_Pesan_ModelPoisson_A + (Ongkos_Kekurangan_Barang_ModelPoisson_Cu * alpha_poisson * qo_1_Poisson)) /
            Ongkos_Simpan_ModelPoisson_h
        )
        
        # Hitung nilai alpha
        alpha_poisson = (Ongkos_Simpan_ModelPoisson_h * qo_1_Poisson) / (Ongkos_Kekurangan_Barang_ModelPoisson_Cu * Rata_Rata_Pemesanan_Barang_ModelPoisson_D)
        
        while True:
            # Hitung probabilitas kumulatif iterasi
            probabilitas_kumulatif_poisson_reorder_point = poisson.cdf(reorder_point_Poisson, x_Poisson)
            
            # Tetap lakukan looping hingga 1-probabilitas_kumulatifnya <= alpha_poisson
            if 1 - probabilitas_kumulatif_poisson_reorder_point <= alpha_poisson:
                break
            
            # Iterasi
            reorder_point_Poisson += 1

        # Cek kondisi untuk menghentikan loop utama
        if abs(reorder_point_Poisson - reorder_point_awal_Poisson) <= 10:
            # print(f"Nilai reorder point r1* pada Iterasi ke-{iterasi:.0f} adalah {reorder_point_Poisson:.0f} Unit")
            break

    # Hitung nilai Safety Stock (SS)
    SS_Poisson = reorder_point_Poisson - (Rata_Rata_Pemesanan_Barang_ModelPoisson_D * Lead_Time_ModelPoisson_L)
    
    # Hitung nilai dari Ongkos Inventori (OT)
    Ongkos_Inventori_Poisson = (
        (Rata_Rata_Pemesanan_Barang_ModelPoisson_D * Harga_Barang_ModelPoisson_p) +
        ((Ongkos_Pesan_ModelPoisson_A * Rata_Rata_Pemesanan_Barang_ModelPoisson_D) / qo_1_Poisson) +
        Ongkos_Simpan_ModelPoisson_h * (0.5 * qo_1_Poisson + SS_Poisson) +
        (Ongkos_Kekurangan_Barang_ModelPoisson_Cu * alpha_poisson * Rata_Rata_Pemesanan_Barang_ModelPoisson_D)
    )
    
    Service_Level_Poisson = (1 - alpha_poisson) * 100

    # Simpan hasil dalam dictionary
    hasil_Model_Poisson = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Rata-Rata Permintaan Barang (D) Unit/Tahun": Rata_Rata_Pemesanan_Barang_ModelPoisson_D,
        "Standar Deviasi Permintaan Barang (s) Unit/Tahun": Standar_Deviasi_Barang_ModelPoisson_S,
        "Lead Time (L) Tahun": Lead_Time_ModelPoisson_L,
        "Ongkos Pesan (A) /Pesan": Ongkos_Pesan_ModelPoisson_A,
        "Harga Barang (p) /Unit": Harga_Barang_ModelPoisson_p,
        "Ongkos Simpan (h) /Unit/Tahun": Ongkos_Simpan_ModelPoisson_h,
        "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun": Ongkos_Kekurangan_Barang_ModelPoisson_Cu,
        "Nilai Alpha": alpha_poisson,
        "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun": Standar_Deviasi_Waktu_Ancang_Ancang_SL,
        "Economic Order Quantity (EOQ) Lot Optimum (qo1)": qo_1_Poisson,
        "Reorder Point (ROP) Unit": reorder_point_Poisson,
        "Safety Stock (SS) Unit": SS_Poisson,
        "Service Level (%)": Service_Level_Poisson,
        "Ongkos Inventori (OT) /Tahun": Ongkos_Inventori_Poisson
    }

    return hasil_Model_Poisson

# Kebijakan Inventori Tak Tentu – Model Tchebycheff
def Model_Tchebycheff_TakTentu(
        Harga_Barang_model_Tchebycheff_p, 
        Kerugian_Ketidakadaan_barang_model_Tchebycheff_Cu, 
        Standar_Deviasi_model_Tchebycheff_s, 
        Rata_Rata_Permintaan_barang_model_Tchebycheff_alpha, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None
    ):
    
    if MaterialCode is np.nan:
        if pd.isna(MaterialCode):
            MaterialCode = ""

    if Material_Description is np.nan:
        if pd.isna(Material_Description):
            Material_Description = ""

    if ABC_Indikator is np.nan:
        if pd.isna(ABC_Indikator):
            ABC_Indikator = ""

    # Perhitungan parameter model Tchebycheff
    model_Tchebycheff_k = pow(2 * Kerugian_Ketidakadaan_barang_model_Tchebycheff_Cu / 
                              (Harga_Barang_model_Tchebycheff_p * Standar_Deviasi_model_Tchebycheff_s), 1/3)
    
    model_Tchebycheff_q0 = round(Rata_Rata_Permintaan_barang_model_Tchebycheff_alpha + 
                                 model_Tchebycheff_k * Standar_Deviasi_model_Tchebycheff_s, 0)

    # Simpan hasil dalam dictionary
    hasil_model_Tchebycheff_TakTentu = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Harga Barang (p) /Unit": Harga_Barang_model_Tchebycheff_p,
        "Kerugian Ketidakadaan Barang (Cu) /Unit": Kerugian_Ketidakadaan_barang_model_Tchebycheff_Cu,
        "Standar Deviasi Permintaan Barang (s)": Standar_Deviasi_model_Tchebycheff_s,
        "Rata-Rata Permintaan Barang (alpha)": Rata_Rata_Permintaan_barang_model_Tchebycheff_alpha,
        "Nilai K Model Tchebycheff": model_Tchebycheff_k,
        "Lot Pemesanan Optimal (q0)": model_Tchebycheff_q0
    }
    return hasil_model_Tchebycheff_TakTentu

# Model Inventori No Moving – Kriteria Minimasi Regret
def Model_MinMaxRegret(
        Ongkos_pemakaian_komponen_H, 
        Ongkos_Kerugian_akibat_kerusakan_L, 
        Jumlah_komponen_terpasang_m=5, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None,
        Harga_resale_komponen_O=None,
    ):
    # Set default value for Harga_resale_komponen_O if not provided
    if Harga_resale_komponen_O is None:
        Harga_resale_komponen_O = Ongkos_pemakaian_komponen_H * 0.2

    # 3. Fungsi untuk menghitung matriks pay-off
    def matrix_payoff(Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O):
        matriks = np.zeros((Jumlah_komponen_terpasang_m + 1, Jumlah_komponen_terpasang_m + 1))
        for strategi_penyediaan_qi in range(Jumlah_komponen_terpasang_m + 1):
            for ekspetasi_kerusakan_Dj in range(Jumlah_komponen_terpasang_m + 1):
                if strategi_penyediaan_qi >= ekspetasi_kerusakan_Dj:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) - (Harga_resale_komponen_O * (strategi_penyediaan_qi - ekspetasi_kerusakan_Dj))
                else:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) + (Ongkos_Kerugian_akibat_kerusakan_L * (ekspetasi_kerusakan_Dj - strategi_penyediaan_qi))
        return matriks

    # 4. Fungsi untuk menghitung matriks penyesalan
    def matrix_penyesalan(matriks_payoff):
        matriks_penyesalan = np.zeros_like(matriks_payoff)
        for qi in range(matriks_payoff.shape[0]):
            for Dj in range(matriks_payoff.shape[1]):
                if qi == Dj:
                    matriks_penyesalan[qi,Dj] = 0
                elif qi > Dj:
                    matriks_penyesalan[qi,Dj] = ((qi - Dj)*Ongkos_pemakaian_komponen_H) - ((qi - Dj)*Harga_resale_komponen_O)
                elif qi < Dj:
                    matriks_penyesalan[qi,Dj] = (Dj-qi)*Ongkos_pemakaian_komponen_H
        return matriks_penyesalan

    # 5. Menghitung matriks pay-off dan matriks penyesalan
    matriks_hasil_payoff = matrix_payoff(
        Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O
    )
    matriks_hasil_penyesalan = matrix_penyesalan(matriks_hasil_payoff)

    # 6. Mengonversi matriks penyesalan menjadi DataFrame
    matriks_hasil_penyesalan_df = pd.DataFrame(
        matriks_hasil_penyesalan, columns=[f'Kerusakan {i}' for i in range(Jumlah_komponen_terpasang_m + 1)]
    )
    matriks_hasil_penyesalan_df['Pay-off Penyesalan'] = matriks_hasil_penyesalan_df.max(axis=1)

    # Menghitung hasil Model Min-Max Regret
    min_regret = min(matriks_hasil_penyesalan_df['Pay-off Penyesalan'])
    strategi_optimal = matriks_hasil_penyesalan_df['Pay-off Penyesalan'].idxmin()

    # Simpan hasil dalam dictionary
    hasil_Model_MinMaxRegret = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Ongkos Pemakaian Komponen (H)": Ongkos_pemakaian_komponen_H,
        "Ongkos Kerugian Akibat Kerusakan (L)": Ongkos_Kerugian_akibat_kerusakan_L,
        "Jumlah Komponen Terpasang (m)": Jumlah_komponen_terpasang_m,
        "Harga Resale Komponen (O)": Harga_resale_komponen_O,
        "Minimum Regret (Rp )": min_regret,
        "Strategi Penyediaan Optimal (Unit)": strategi_optimal
    }
    return hasil_Model_MinMaxRegret

# Model Inventori No Moving – Estimasi Liner
def model_kerusakan_linear(
        Ongkos_pemakaian_komponen_H,
        Ongkos_Kerugian_akibat_kerusakan_L, 
        Jumlah_komponen_terpasang_m=5, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None,
        Harga_resale_komponen_O=None,
    ):
    # Set default value for Harga_resale_komponen_O if not provided
    if Harga_resale_komponen_O is None:
        Harga_resale_komponen_O = Ongkos_pemakaian_komponen_H * 0.2

    # 1. Fungsi untuk menghitung matriks pay-off
    def matrix_payoff(Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O):
        matriks = np.zeros((Jumlah_komponen_terpasang_m + 1, Jumlah_komponen_terpasang_m + 1))
        for strategi_penyediaan_qi in range(Jumlah_komponen_terpasang_m + 1):
            for ekspetasi_kerusakan_Dj in range(Jumlah_komponen_terpasang_m + 1):
                if strategi_penyediaan_qi >= ekspetasi_kerusakan_Dj:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) - (Harga_resale_komponen_O * (strategi_penyediaan_qi - ekspetasi_kerusakan_Dj))
                else:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) + (Ongkos_Kerugian_akibat_kerusakan_L * (ekspetasi_kerusakan_Dj - strategi_penyediaan_qi))
        return matriks
    
    # Membuat matriks ongkos inventori dari fungsi matrix_payoff
    matriks_hasil_payoff_kerusakan_linear = matrix_payoff(Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O)

    matriks_hasil_payoff_kerusakan_linear_df = pd.DataFrame(matriks_hasil_payoff_kerusakan_linear, columns=[f'Kerusakan {i}' for i in range(Jumlah_komponen_terpasang_m+1)])


    # Hitung Nilai P(Dj)
    sum_dj = sum(range(Jumlah_komponen_terpasang_m+1))
    for Dj in range(Jumlah_komponen_terpasang_m+1):
        value = (Jumlah_komponen_terpasang_m - Dj) / sum_dj
        matriks_hasil_payoff_kerusakan_linear_df.at['P(Dj)', f'Kerusakan {Dj}'] = value

    # Inisialisasi kolom E(Qi)
    matriks_hasil_payoff_kerusakan_linear_df['E(Qi)'] = 0.0  

    # Hitung nilai E(Qi)
    for i in range(len(matriks_hasil_payoff_kerusakan_linear_df.index) - 1):  # -1 untuk tidak termasuk baris 'P(Dj)'
        E_qi = 0  # Inisialisasi E_qi untuk baris ini
        for j in range(Jumlah_komponen_terpasang_m+1):  # Menerapkan sum pada definisi E(Qi)
            E_qi += matriks_hasil_payoff_kerusakan_linear_df.loc['P(Dj)', f'Kerusakan {j}'] * matriks_hasil_payoff_kerusakan_linear_df.iloc[i, j]
        matriks_hasil_payoff_kerusakan_linear_df.at[matriks_hasil_payoff_kerusakan_linear_df.index[i], 'E(Qi)'] = E_qi

    # Format matriks hasil payoff kerusakan linear
    matriks_hasil_payoff_kerusakan_linear_df.at['P(Dj)', 'E(Qi)'] = np.nan

    # Simpan hasil dalam dictionary
    hasil_model_kerusakan_linear = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Ongkos Pemakaian Komponen (H)": Ongkos_pemakaian_komponen_H,
        "Ongkos Kerugian Akibat Kerusakan (L)": Ongkos_Kerugian_akibat_kerusakan_L,
        "Jumlah Komponen Terpasang (m)": Jumlah_komponen_terpasang_m,
        "Harga Resale Komponen (O)": Harga_resale_komponen_O,
        "Ongkos Model Probabilistik Kerusakan": min(matriks_hasil_payoff_kerusakan_linear_df['E(Qi)']),
        "Strategi Penyediaan Optimal (Unit)": matriks_hasil_payoff_kerusakan_linear_df['E(Qi)'].idxmin()
    }

    return hasil_model_kerusakan_linear

# Model Inventori No Moving – Estimasi Hiperbolis
def model_kerusakan_non_linear(
        Ongkos_pemakaian_komponen_H, 
        Ongkos_Kerugian_akibat_kerusakan_L, 
        Jumlah_komponen_terpasang_m=5, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None,
        Harga_resale_komponen_O=None, 
        beta=4
    ):
    # Set default value for Harga_resale_komponen_O if not provided
    if Harga_resale_komponen_O is None:
        Harga_resale_komponen_O = Ongkos_pemakaian_komponen_H * 0.2

    # Validasi nilai beta hanya boleh 4 atau 5
    if beta not in [4, 5]:
        raise ValueError("Nilai beta hanya boleh 4 atau 5.")

    # 1. Fungsi untuk menghitung matriks pay-off
    def matrix_payoff(Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O):
        matriks = np.zeros((Jumlah_komponen_terpasang_m + 1, Jumlah_komponen_terpasang_m + 1))
        for strategi_penyediaan_qi in range(Jumlah_komponen_terpasang_m + 1):
            for ekspetasi_kerusakan_Dj in range(Jumlah_komponen_terpasang_m + 1):
                if strategi_penyediaan_qi >= ekspetasi_kerusakan_Dj:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) - (Harga_resale_komponen_O * (strategi_penyediaan_qi - ekspetasi_kerusakan_Dj))
                else:
                    matriks[strategi_penyediaan_qi, ekspetasi_kerusakan_Dj] = (
                        Ongkos_pemakaian_komponen_H * strategi_penyediaan_qi
                    ) + (Ongkos_Kerugian_akibat_kerusakan_L * (ekspetasi_kerusakan_Dj - strategi_penyediaan_qi))
        return matriks

    # Membuat matriks ongkos inventori dari fungsi matrix_payoff
    matriks_hasil_payoff_kerusakan_non_linear = matrix_payoff(Jumlah_komponen_terpasang_m, Ongkos_pemakaian_komponen_H, Ongkos_Kerugian_akibat_kerusakan_L, Harga_resale_komponen_O)

    matriks_hasil_payoff_kerusakan_non_linear_df = pd.DataFrame(matriks_hasil_payoff_kerusakan_non_linear, columns=[f'Kerusakan {i}' for i in range(Jumlah_komponen_terpasang_m+1)])

    # Hitung batas maksimum untuk nilai P(Dj) pada beta 4 dan beta 5
    max_Dj_beta_4 = 8
    max_Dj_beta_5 = 10

    # Hitung Nilai P(Dj) dengan logika non-linear
    sum_inverse = sum(1 / (beta * Dj) for Dj in range(1, Jumlah_komponen_terpasang_m+1))  # Sum untuk Dj > 0
    for Dj in range(Jumlah_komponen_terpasang_m+1):
        if Dj == 0:
            value = 1 - sum_inverse
            if beta == 4 and value > max_Dj_beta_4:
                beta = 5
                # print(f"Nilai pada Dj = 0 lebih besar dari batas maksimum untuk beta 4. Beta diubah menjadi {beta}.")
                sum_inverse = sum(1 / (beta * Dj) for Dj in range(1, Jumlah_komponen_terpasang_m+1))
                value = 1 - sum_inverse
                if value > max_Dj_beta_5:
                    # print("range(Jumlah_komponen_terpasang_m+1) harus dibatasi/dikurangi.")
                    break
        else:
            if beta == 4 and 1 / (beta * Dj) > max_Dj_beta_4:
                value = max_Dj_beta_4
            elif beta == 5 and 1 / (beta * Dj) > max_Dj_beta_5:
                value = max_Dj_beta_5
            else:
                value = 1 / (beta * Dj)
        matriks_hasil_payoff_kerusakan_non_linear_df.at['P(Dj)', f'Kerusakan {Dj}'] = value

    # Inisialisasi kolom E(Qi)
    matriks_hasil_payoff_kerusakan_non_linear_df['E(Qi)'] = 0.0  

    # Hitung nilai E(Qi)
    for i in range(len(matriks_hasil_payoff_kerusakan_non_linear_df.index) - 1):  # -1 untuk tidak termasuk baris 'P(Dj)'
        E_qi = 0  # Inisialisasi E_qi untuk baris ini
        for j in range(Jumlah_komponen_terpasang_m+1):  # Menerapkan sum pada definisi E(Qi)
            E_qi += matriks_hasil_payoff_kerusakan_non_linear_df.loc['P(Dj)', f'Kerusakan {j}'] * matriks_hasil_payoff_kerusakan_non_linear_df.iloc[i, j]
        matriks_hasil_payoff_kerusakan_non_linear_df.at[matriks_hasil_payoff_kerusakan_non_linear_df.index[i], 'E(Qi)'] = E_qi

    # Format matriks hasil payoff kerusakan non-linear
    matriks_hasil_payoff_kerusakan_non_linear_df.at['P(Dj)', 'E(Qi)'] = np.nan

    # Simpan hasil dalam dictionary
    hasil_model_kerusakan_non_linear = {
        "Material Code": MaterialCode,
        "Material Description": Material_Description,
        "ABC Indicator": ABC_Indikator,
        "Ongkos Pemakaian Komponen (H)": Ongkos_pemakaian_komponen_H,
        "Ongkos Kerugian Akibat Kerusakan (L)": Ongkos_Kerugian_akibat_kerusakan_L,
        "Jumlah Komponen Terpasang (m)": Jumlah_komponen_terpasang_m,
        "Harga Resale Komponen (O)": Harga_resale_komponen_O,
        "Ongkos Model Probabilistik Kerusakan": min(matriks_hasil_payoff_kerusakan_non_linear_df['E(Qi)']),
        "Strategi Penyediaan Optimal (Unit)": matriks_hasil_payoff_kerusakan_non_linear_df['E(Qi)'].idxmin()
    }

    return hasil_model_kerusakan_non_linear

# Mdel BCR
def Model_Inventori_BCR(
        Harga_Komponen_Ho,
        Kerugian_Komponen_Co, 
        Suku_bunga_i, 
        Waktu_sisa_operasi=5, 
        MaterialCode=None, 
        Material_Description=None, 
        ABC_Indikator=None,
        probabilitas="uniform"
    ):
    # Jika input bukan list, ubah menjadi list
    if isinstance(Waktu_sisa_operasi, (int, float)):
        Waktu_sisa_operasi = [Waktu_sisa_operasi]

    hasil_perhitungan = []
    df_hasil_list = []
    final_hasil_list = []

    for waktu in Waktu_sisa_operasi:
        # Skip jika waktu adalah 0
        if waktu == 0:
            continue

        # Looping dari tahun 0 hingga waktu dalam Waktu_sisa_operasi
        for t in range(waktu + 1):
            if t == 0:
                Benefit_t = None
                BCR = None
                Probabilitas_Kerusakan_Pt = 0  # Inisialisasi nilai 0 untuk t == 0
                Kerugian_Komponen_PeriodeT_Ct = Kerugian_Komponen_Co * ((1 + Suku_bunga_i) ** t)
                Ongkos_Pemakaian_periodeT_Ht = Harga_Komponen_Ho * ((1 + Suku_bunga_i) ** t)
            else:
                Kerugian_Komponen_PeriodeT_Ct = Kerugian_Komponen_Co * ((1 + Suku_bunga_i) ** t)
                Ongkos_Pemakaian_periodeT_Ht = Harga_Komponen_Ho * ((1 + Suku_bunga_i) ** t)
                
                # Menghitung probabilitas berdasarkan jenis probabilitas yang dipilih
                if probabilitas == "uniform":
                    Probabilitas_Kerusakan_Pt = 1 / waktu
                elif probabilitas == "linear":
                    sigma_t = sum(range(1, waktu + 1))
                    Probabilitas_Kerusakan_Pt = t / sigma_t
                elif probabilitas == "hiperbolik":
                    sigma_sqrt_t = sum(np.sqrt(t) for t in range(1, waktu + 1))
                    Probabilitas_Kerusakan_Pt = np.sqrt(t) / sigma_sqrt_t
                elif probabilitas == "kuadratis":
                    sigma_t_squared = sum(t**2 for t in range(1, waktu + 1))
                    Probabilitas_Kerusakan_Pt = t**2 / sigma_t_squared
                elif probabilitas == "kubik":
                    sigma_t_kubik = sum(t**3 for t in range(1, waktu + 1))
                    Probabilitas_Kerusakan_Pt = t**3 / sigma_t_kubik
                else:
                    raise ValueError("Jenis probabilitas tidak dikenal. Gunakan 'uniform', 'linear', 'hiperbolik', 'kuadratis', atau 'kubik'.")

                Benefit_t = Probabilitas_Kerusakan_Pt * Kerugian_Komponen_PeriodeT_Ct
                BCR = Benefit_t / Ongkos_Pemakaian_periodeT_Ht

            # Simpan hasil ke dalam list untuk dataframe
            df_hasil_list.append({
                "Tahun": t,
                "Probabilitas Kerusakan (Pt)": Probabilitas_Kerusakan_Pt,
                "Kerugian Komponen Periode T (Ct)": Kerugian_Komponen_PeriodeT_Ct,
                "Ongkos Pemakaian Periode T (Ht)": Ongkos_Pemakaian_periodeT_Ht,
                "Benefit T": Benefit_t,
                "BCR": BCR
            })

        # Setelah loop selesai, cari nilai BCR > 1
        pembelian_ditemukan = False
        for row in df_hasil_list:
            if row["BCR"] and row["BCR"] > 1:
                tahun_optimal = row["Tahun"] - 1  # Dikurangi 1 sesuai permintaan Anda
                # print(f"\nDari hasil hitung dengan model BCR ini diperoleh pembelian sparepart pada tahun ke-{tahun_optimal} karena nilai BCR == {row['BCR']:.2f}\n")

                # Simpan hasil ke dalam list untuk dataframe final
                final_hasil_list.append({
                    "Tahun": tahun_optimal,  # Menambahkan kolom Tahun
                    "Waktu Sisa Operasi (tahun)": waktu,
                    "Harga Komponen (Ho)": Harga_Komponen_Ho,
                    "Kerugian Komponen (Co)": Kerugian_Komponen_Co,
                    "Suku Bunga (i)": Suku_bunga_i,
                    "Probabilitas Kerusakan (Pt)": row["Probabilitas Kerusakan (Pt)"],
                    "Kerugian Komponen Periode T (Ct)": row["Kerugian Komponen Periode T (Ct)"],
                    "Ongkos Pemakaian Periode T (Ht)": row["Ongkos Pemakaian Periode T (Ht)"],
                    "Benefit-Cost Ratio (BCR)": row["BCR"],
                    "Probabilitas": probabilitas  # Menambahkan informasi jenis probabilitas
                })
                
                pembelian_ditemukan = True
                break

        # Jika tidak ada nilai BCR > 1, tampilkan pesan
        if not pembelian_ditemukan:
            # print("\nTidak ada pembelian sparepart yang direkomendasikan karena tidak ada nilai BCR > 1.\n")
            ""

    # Simpan hasil dalam dictionary serupa dengan model non-linear yang Anda inginkan
    if pembelian_ditemukan:
        hasil_model_bcr = {
            "Material Code": MaterialCode,
            "Material Description": Material_Description,
            "ABC Indicator": ABC_Indikator,
            "Harga Komponen (Ho)": Harga_Komponen_Ho,
            "Kerugian Komponen (Co)": Kerugian_Komponen_Co,
            "Suku Bunga (i)": Suku_bunga_i,
            "Waktu Sisa Operasi (tahun)": waktu,
            "Benefit-Cost Ratio (BCR)": row["BCR"],
            "Strategi Penyediaan Optimal (Tahun)": tahun_optimal,
            "Jenis Probabilitas": probabilitas
        }
    else:
        hasil_model_bcr = {
            "Material Code": MaterialCode,
            "Material Description": Material_Description,
            "ABC Indicator": ABC_Indikator,
            "Harga Komponen (Ho)": Harga_Komponen_Ho,
            "Kerugian Komponen (Co)": Kerugian_Komponen_Co,
            "Suku Bunga (i)": Suku_bunga_i,
            "Waktu Sisa Operasi (tahun)": waktu,
            "Pesan": "Tidak ada pembelian sparepart yang direkomendasikan"
        }

    return hasil_model_bcr

def model_wilson(code, description, indicator, p, A, h, D, L):
    qo = math.sqrt((2*A*D)/h)
    r = D*L
    T = math.sqrt((2*A)/(D*h)) * 365
    OT = D*p + math.sqrt(2*A*D*h)

    f = D/qo
    Ob = D*p
    Op = f*A
    Os = 0.5*h*qo

    return {
        #base
        "Material Code": code,
        "Material Description": description,
        "ABC Indicator": indicator,
        #input
        'Harga Barang Rp/Unit (p)': p,
        'Ongkos Pesan Rp/Unit (A)': A,
        'Ongkos Simpan Barang Rp/Unit/Tahun (h)': h,
        'Rata-Rata Permintaan Barang Unit/Tahun (D)': D,
        'Lead Time /Tahun (L)': L,
        #proses
        'Frequensi Pemesanan (f)': f,
        "Ongkos Pembelian /Tahun (Ob)": Ob,
        "Ongkos Pemesanan /Tahun (Op)": Op,
        "Ongkos Penyimpanan /Tahun (Os)": Os,
        #output
        'Lot Pengadaan Barang EOQ Unit/Pesanan (qo)': qo,
        'Re-Order Point ROP /Unit (r)': r,
        'Selang Waktu /Hari (T)': T,
        'Ongkos Inventori Total /Tahun': OT
    }

def model_q(code, description, indicator, p, A, h, Cu, D, s, L):
    qo = math.sqrt((2*A*D)/h)  #Hitung qo
    a = (h*qo)/(Cu*D) #Hitung alpha ke 1 dan SL
    SL = s*math.sqrt(L)
    DL = D*L
    Za = norm.ppf(1 - a) # Hitung Za menggunakan PPF (Percent Point Function)
    r = Za*SL + DL

    iterasi = 1
    while True: # mulai iterasi
        r1 = r
        fZa = norm.pdf(Za) #Hitung f(Za) atau ϕ(Za) menggunakan PDF (Probability Density Function)
        phiZa = norm.cdf(Za) #Hitung Φ(Za) menggunakan CDF (Cumulative Distribution Function)
        psiZa = fZa - Za*(1 - phiZa) #Hitung Psi Za

        N = SL*(fZa - Za*psiZa) #Hitung N

        qo = math.sqrt(2*D*(A + (Cu*N))/h) #Hitung q ke2
        a = (h*qo)/(Cu*D) #Hitung alpha ke2
        Za = norm.ppf(1 - a) # Hitung Za ke2 menggunakan PPF (Percent Point Function)

        r2 = DL + Za*SL

        perbandingan = (abs(r1 - r2) / ((r1 + r2) / 2)) * 100
        r = r2

        if perbandingan < 1 or iterasi == 10: break
        iterasi += 1

    f = D/qo
    Ob = D*p
    Op = f*A
    Os = h*(0.5*qo + r - DL)
    Ok = Cu*N

    ss = Za*SL #Hitung Safety Stock
    n = (1 - (N/DL))*100 #Hitung Tingkat Pelayanan
    OT = D*p + (A*D/qo) + h*(1/2*qo + r - DL) + Cu*(D/qo)*N #Hitung Ongkos Inventory

    return {
        # base
        'Material Code': code,
        'Material Description': description,
        'ABC Indicator': indicator,
        # input
        'Harga Barang Rp/Unit (p)': p,
        'Ongkos Pesan Rp/Pesan (A)': A,
        'Ongkos Simpan Barang Rp/Unit/Tahun (h)': h,
        'Ongkos Kekurangan Barang Rp/Unit (Cu)': Cu,
        'Rata-Rata Permintaan Unit/Tahun (D)': D,
        'Standar Deviasi Permintaan Barang Unit/Tahun (s)': s,
        'Lead Time /Tahun (L)': L,
        # proses
        'Iterasi': iterasi,
        "Standar Deviasi Lead Time Unit/Tahun (SL)": SL,
        "Rata-Rata Permintaan Lead Time Unit/Tahun (DL)": DL,
        "Frequensi Pemesanan (f)": f,
        "Ongkos Pembelian (Ob) /Tahun": Ob,
        "Ongkos Pemesanan (Op) /Tahun": Op,
        "Ongkos Penyimpanan (Os) /Tahun": Os,
        "Ongkos Kekurangan Inventori (Ok) /Tahun": Ok,
        # output
        'Lot Pengadaan Barang EOQ Unit/Pesanan (qo)': qo,
        'Reorder Point ROP /Unit (r)': r,
        'Safety Stock /Unit (ss)': ss,
        'Ongkos Inventori Total /Tahun (OT)': OT,
        'Tingkat Pelayanan %': n
    }

def model_poisson(code, description, indicator, p, A, h, Cu, D, s, L):
    SL = s*math.sqrt(L)
    qo = math.sqrt(2*(A*D)/h) #Hitung lot pemesanan
    a = (h*qo)/(Cu*D) #Hitung alpha
    r = 0

    # Mulai iterasi
    for j in count():
        rx = 0
        lambd = D*L

        while True:
            Px = poisson.cdf(rx, lambd)
            if 1 - Px <= a: break #Akhir loop 1-px <= alpha
            rx += 1

        if r == rx:break #Akhir iterasi saat reorder iterasi sebelumnya == reorder iterasi saat ini

        # Update reorder, lot dan alpha
        r = rx
        qot = math.sqrt(2*D*((A + Cu*(a*qo))/h))
        a = (h*qot)/(Cu*D)

        if j > 10: break #Hentikan iterasi jika lebih dari 10x iterasi
        j += 1

    ss = r - D*L #Hitung safety stock
    OT = D*p + A*D/qo + h*(0.5*qo + r - D*L) + Cu*a*D #Hitung Ongkos Inventory

    n = (1 - a)*100 #Hitung Tingkat Pelayanan
    iterasi = j + 1

    return {
        # base
        'Material Code': code or '',
        'Material Description': description or '',
        'ABC Indicator': indicator or '',
        # input
        'Harga Barang Rp/Unit (p)': p,
        'Ongkos Pesan Rp/Pesan (A)': A,
        'Ongkos Simpan Rp/Unit/Tahun (h)': h,
        'Ongkos Kekurangan Rp/Unit (Cu)': Cu,
        'Rata-Rata Permintaan Unit/Tahun (D)': D,
        'Standar Deviasi Permintaan Unit/Tahun (s)': s,
        'Lead Time /tahun (L)': L,
        # proses
        'Iterasi': iterasi,
        'Nilai Alpha (a)': a,
        'Standar Deviasi Waktu Ancang-ancang Unit/Tahun (SL)': SL,
        # output
        'Economic Order Quantity EOQ Unit/Pesanan (qo)': qo,
        'Reorder Point ROP /Unit (r)': r,
        'Safety Stock /Unit (ss)': ss,
        'Ongkos Inventori /Tahun (OT)': OT,
        'Tingkat pelayanan % (n)': n
    }

def model_tchebycheff(code, description, indicator, p, Cu, a, s):
    k =  math.pow(2*Cu/(p*s), 1/3)

    qo = a + k*s

    return {
        #base
        'Material Code': code or None,
        'Material Description': description or None,
        'ABC Indicator': indicator or None,
        #input
        'Ongkos pemakaian Rp/Unit/Hari (p)': p,
        'Kerugian Akibat Kerusakan Rp/Unit/Hari (Cu)': Cu,
        'Rata-Rata Permintaan Barang Unit/Tahun (a)': a,
        'Standar Deviasi Permintaan Barang Unit/Tahun (s)': s,
        #proses
        'Nilai K Model Tchebycheff': k,
        #output
        'Ukuran Lot Penyediaan (qo)': qo
    }

def model_minimasi_regret(code, description, indicator, H, L, m):
    O = H*0.2
    payoff = np.zeros((m + 1, m + 1))
    for qi in range(m + 1):
        for Dj in range(m + 1):
            if qi >= Dj: payoff[qi, Dj] = (H*qi) - (O*(qi - Dj))
            else: payoff[qi, Dj] = (H*qi) + (L*(Dj - qi))

    penyesalan = np.zeros_like(payoff)
    for qi in range(payoff.shape[0]):
        for Dj in range(payoff.shape[1]):
            if qi == Dj: penyesalan[qi,Dj] = 0
            elif qi > Dj: penyesalan[qi,Dj] = ((qi - Dj)*H) - ((qi - Dj)*O)
            elif qi < Dj: penyesalan[qi,Dj] = (Dj - qi)*H

    df = pd.DataFrame(penyesalan, columns=[f'Kerusakan {i}' for i in range(m + 1)])
    df['Pay-off Penyesalan'] = df.max(axis=1)

    Eqi = min(df['Pay-off Penyesalan'])
    qi = df['Pay-off Penyesalan'].idxmin()

    return {
        #base
        'Material Code': code,
        'Material Description': description,
        'ABC Indicator': indicator,
        #input
        'Ongkos Pemakaian Rp/Unit/Tahun (H)': H,
        'Kerugian Akibat Kerusakan Rp/Unit/Hari (L)': L,
        'Jumlah Komponen Terpasang /Unit (m)': m,
        #proses
        'Harga Resale Rp/Unit/Hari (O)': O,
        #output
        'Ekspetasi Ongkos Inventory Minimum /Rp': Eqi,
        'Ukuran Lot Penyediaan /Unit (qi)': qi
    }

def model_estimasi_probabilitas_linear(code, description, indicator, H, L, m):
    O = H*0.2
    payoff = np.zeros((m + 1, m + 1))
    for qi in range(m + 1):
        for Dj in range(m + 1):
            if qi >= Dj: payoff[qi, Dj] = (H*qi) - (O*(qi - Dj))
            else: payoff[qi, Dj] = (H*qi) + (L*(Dj - qi))

    df = pd.DataFrame(payoff, columns=[f'Kerusakan {i}' for i in range(m + 1)])

    dj = sum(range(m + 1))
    for Dj in range(m + 1):
        value = (m - Dj) / dj
        df.at['P(Dj)', f'Kerusakan {Dj}'] = value

    df['E(Qi)'] = 0.0  

    for i in range(len(df.index) - 1):
        E_qi = 0 
        for j in range(m+1):
            E_qi += df.loc['P(Dj)', f'Kerusakan {j}'] * df.iloc[i, j]
        df.at[df.index[i], 'E(Qi)'] = E_qi

    df.at['P(Dj)', 'E(Qi)'] = np.nan

    return {
        #base
        'Material Code': code,
        'Material Description': description,
        'ABC Indicator': indicator,
        #input
        'Ongkos Pemakaian Rp/Unit/Tahun (H)': H,
        'Kerugian Akibat Kerusakan Rp/Unit/Hari (L)': L,
        'Jumlah Komponen Terpasang /Unit (m)': m,
        #proses
        'Harga Resale Rp/Unit/Hari (O)': O,
        #output
        'Ekspetasi Ongkos Inventory Minimum /Rp': min(df['E(Qi)']),
        'Ukuran Lot Penyediaan /Unit (qi)': df['E(Qi)'].idxmin()
    }

def model_estimasi_probabilitas_hiperbolis(code, description, indicator, H, L, m):
    O = H*0.2
    beta = 4

    payoff = np.zeros((m + 1, m + 1))
    for qi in range(m + 1):
        for Dj in range(m + 1):
            if qi >= Dj: payoff[qi, Dj] = (H*qi) - (O*(qi - Dj))
            else: payoff[qi, Dj] = (H*qi) + (L*(Dj - qi))

    df = pd.DataFrame(payoff, columns=[f'Kerusakan {i}' for i in range(m + 1)])
    max_Dj_beta_4 = 8
    max_Dj_beta_5 = 10

    sum_inverse = sum(1 / (beta * Dj) for Dj in range(1, m + 1))
    for Dj in range(m + 1):
        if Dj == 0:
            value = 1 - sum_inverse
            if beta == 4 and value > max_Dj_beta_4:
                beta = 5
                sum_inverse = sum(1 / (beta * Dj) for Dj in range(1, m + 1))
                value = 1 - sum_inverse
                if value > max_Dj_beta_5: break
        else:
            if beta == 4 and 1 / (beta * Dj) > max_Dj_beta_4: value = max_Dj_beta_4
            elif beta == 5 and 1 / (beta * Dj) > max_Dj_beta_5: value = max_Dj_beta_5
            else: value = 1 / (beta*Dj)

        df.at['P(Dj)', f'Kerusakan {Dj}'] = value

    df['E(Qi)'] = 0.0  

    for i in range(len(df.index) - 1):  # -1 untuk tidak termasuk baris 'P(Dj)'
        E_qi = 0  # Inisialisasi E_qi untuk baris ini
        for j in range(m + 1):  # Menerapkan sum pada definisi E(Qi)
            E_qi += df.loc['P(Dj)', f'Kerusakan {j}'] * df.iloc[i, j]
        df.at[df.index[i], 'E(Qi)'] = E_qi

    df.at['P(Dj)', 'E(Qi)'] = np.nan

    return {
        #base
        'Material Code': code,
        'Material Description': description,
        'ABC Indicator': indicator,
        #input
        'Ongkos Pemakaian Rp/Unit/Tahun (H)': H,
        'Kerugian Akibat Kerusakan Rp/Unit/Hari (L)': L,
        'Jumlah Komponen Terpasang /Unit (m)': m,
        #proses
        'Harga Resale Rp/Unit/Hari (O)': O,
        #output
        'Ekspetasi Ongkos Inventory Minimum /Rp': min(df['E(Qi)']),
        'Ukuran Lot Penyediaan /Unit (qi)': df['E(Qi)'].idxmin()
    }

def model_benefit_cost_ratio(code, description, indicator, Ho, Co, i, N, P):
    #() function probabilitas kerusakan
    def probabilitas_type(t, t_values):
        if P == "uniform":
            P_t_value = 1/len(t_values)
        elif P == "linear":
            total_sigma_t = sum(t_values)
            P_t_value = round(t/total_sigma_t, 3)
        elif P == "hiperbolik":
            sqrt_t = np.sqrt(t_values)
            total_sigma_sqrt_t = np.sum(sqrt_t)
            P_t_value = (sqrt_t/total_sigma_sqrt_t)[t - 1]
        elif P == "kuadratis":
            t_squared = np.array(t_values)**2
            total_t_squared = np.sum(t_squared)
            P_t_value = (t_squared/total_t_squared)[t - 1]
        elif P == "kubik":
            t_cubed = np.array(t_values)**3
            total_t_cubed = np.sum(t_cubed)
            P_t_value = (t_cubed/total_t_cubed)[t-1]
        else:
            raise ValueError(f"Jenis '{P}' tidak valid.")

        return P_t_value

    t_values = list(range(1, N + 1))

    Ht = Ho
    Ct = Co

    for t in t_values:
        Ht =  (1 + i/100)*Ht
        Ct =  (1 + i/100)*Ct
        P_t = probabilitas_type(t, t_values)
        Bt = P_t*Ct #Hitung ekspektasi benefit
        BCRt = Bt/Ht #Hitung nilai benefit

        #=> conditional statement benefit > 1 / benefit == waktu kerusakan
        if BCRt > 1 or t == len(t_values):
            results = {
                # proses
                'Ongkos Pemakaian /Unit (Ht)': Ht,
                'Kerugian Komponen /Unit (Ct)': Ct,
                'Probabilitas Kerusakan P(t)': P_t,
                'Ekspektasi Benefit (Bt)': Bt,
                'Benefit Cost Ration': BCRt,
                # output
                'Remark': 'tidak ada rekomendasi' if t == len(t_values) else t #=> beli sparepart
            }
            break

    #=> hasil akhir
    results.update({
        # base
        'Material Code': code or '',
        'Material Description': description or '',
        'ABC Indicator': indicator or '',
        # input
        'Harga Komponen /Unit (Ho)': Ho,
        'Kerugian Komponen /Unit (Co)': Co,
        'Suku Bunga /Tahun (i)': i,
        'Sisa Operasi /Tahun (N)' :N,
        'Pola Probabilitas (P)': P,
    })

    return results

# contoh dalam laporan
# model wilson
# D = 10,000, p = 8000, A = 1,000,000, L = 0.25, h = 2000
# qo = 3,165, r = 2,500, T = 115, OT = 106,33
# p <> 10,000 (60), qo <> 3,165 : 3,162 (60)
# model q
# D = 100,000, s = 10,000, L = 0.25, A = 2,500,000, p = 25,000, h = 5000, Cu = 100,000
# qo = 21,260, r = 36,500, ss = 11,500, n = 96.48%, OT = 2,783,982,044 perbandingan <1 (71)
# Za 2.525_py <> 2.554_lap (69), Za 2.37_py <> 2.35_lap (70), n = 66% ? 1-()* && D : 96% (1-())* (71) && D
# model poisson
# D = 4, s = 2, L = 0.25, A = 2,500, p = 25,000, h = 5000, Cu = 100,000
# qo = 3,5, r = 3, ss = 2, n = 96%, OT = 133,887
# ½qo1 <> 4/2 : 1/2*2, a <> 0.044 : 0.043, total <> 133,887 : 142,600_lap, 137,320.51_code
# model tchebucheff
# p = 1000,000, Cu = 5000,000, a = 0.33, s = 145
# k = 1.26, qo = 2
# rumus k <> hal 84 : hal 83
# model non movinig
# H = 5,000,000, L = 10,000,000, m = 5
# qi = 3, Eqi = 12 | regret
# qi = 1, Eqi = 1.33 | linear
# qi = 1, 10.86 | hiperbolis # check
# model bcr
# Ho = 100, Co = 1000, i = 10, N = 5, P = uniform, linear, hiperbolik, kuadratis, kubik
# BCRt = {1.33 | 0} {1.33 | 1.09} {1.19 | 1.09} {1.23 | 1.27} {1.33 | 1.13}
# remark = {2 | 0} {2 | 6} {1 | 6} {3 | 7} {2 | 7}
# bt <> 73.7 hal (102) : 220, bt <> 164 hal (106) : 218, pt <> 0.22 hal (108): 0.004