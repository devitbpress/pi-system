const testing = async () => {
    const itemModelQ = {
        rata_rata_permintaan_barang_unit_per_tahun: 7.733333333,
        lead_time_per_tahun: 135.3057143,
        standar_deviasi_permintaan_barang_unit_per_tahun: 2.702914561,
        ongkos_pesan_per_pesan: 1000000,
        harga_barang_per_unit: 56783,
        ongkos_simpan_unit_per_tahun: 8517.45,
        ongkos_kekurangan_inventory_unit_per_tahun: 3720000000,
        material_code: "6020543",
        material_description: "BEARING,BALL:DG;1R;30X72X19MM;2SHLD",
        abc_indikator: "ABC Indicator",
    };
    const responseQ = await postFetch("/api/get/calc/manual", { model: "model q", items: itemModelQ });
    console.log(responseQ);

    const itemWilson = {
        permintaan_barang_unit_per_tahun: 59,
        harga_barang_per_unit: 35,
        ongkos_pesan_per_pesan: 1000000,
        lead_time_per_tahun: 0.2465753425,
        ongkos_simpan_unit_per_tahun: 5.25,
        material_code: "6072060",
        material_descriptio: "BOLT,MACHINE:5/8IN UNCX50.8MM;HEX;B7",
        abc_indikato: "B",
    };
    const responseWilson = await postFetch("/api/get/calc/manual", { model: "model wilson", items: itemWilson });
    console.log(responseWilson);

    const itemPoisson = {
        rata_rata_permintaan_barang_unit_per_tahun: 1.333333333,
        standar_deviasi_permintaan_barang_unit_per_tahun: 0.5773502692,
        lead_time_per_tahun: 0.2465753425,
        ongkos_pesan_per_pesan: 1000000,
        harga_barang_per_unit: 827,
        ongkos_simpan_unit_per_tahun: 124.05,
        ongkos_kekurangan_inventory_unit_per_tahun: 3720000000,
        material_code: "6070822",
        material_descriptio: "SEAL,ENCASED:70X92X12MM;1LIP;NBR",
        abc_indikato: "A",
    };
    const responsePoisson = await postFetch("/api/get/calc/manual", { model: "model poisson", items: itemPoisson });
    console.log(responsePoisson);

    const itemTchebycheff = {
        harga_barang_per_unit: "1000000",
        kerugian_ketidakadaan_barang_per_unit: 3720000000,
        standar_deviasi_permintaan_barang: 32.52691193,
        rata_rata_permintaan_barang: 27,
        material_code: "6072053",
        material_description: "BOLT,MACHINE:5/8IN UNCX47MM;HEX;B7;GALV",
        abc_indikator: "A",
    };
    const responseTchebycheff = await postFetch("/api/get/calc/manual", { model: "model tchebycheff", items: itemTchebycheff });
    console.log(responseTchebycheff);

    const itemMinMaxRegret = {
        ongkos_pemakaian_komponen: 18000000,
        ongkos_kerugian_akibat_kerusakan: 3700000000,
        jumlah_komponen_terpasang: 5,
        material_code: "6187795",
        material_description: "ARRESTOR,FLASHBACK:VICTOR 0656--0006",
        abc_indikator: "C",
    };
    const responseMinMaxRegret = await postFetch("/api/get/calc/manual", { model: "model non moving min max regret", items: itemMinMaxRegret });
    console.log(responseMinMaxRegret);

    const itemLinear = {
        ongkos_pemakaian_komponen: 18000000,
        ongkos_kerugian_akibat_kerusakan: 3700000000,
        jumlah_komponen_terpasang: 5,
        material_code: "6187795",
        material_description: "ARRESTOR,FLASHBACK:VICTOR 0656--0006",
        abc_indikator: "C",
    };
    const responseLinear = await postFetch("/api/get/calc/manual", { model: "model non moving linear", items: itemLinear });
    console.log(responseLinear);

    const itemNonLinear = {
        ongkos_pemakaian_komponen: 18000000,
        ongkos_kerugian_akibat_kerusakan: 3700000000,
        jumlah_komponen_terpasang: 5,
        material_code: "6187795",
        material_description: "ARRESTOR,FLASHBACK:VICTOR 0656--0006",
        abc_indikator: "C",
    };
    const responseNonLinear = await postFetch("/api/get/calc/manual", { model: "model non moving non linear", items: itemNonLinear });
    console.log(responseNonLinear);

    const itemBCR = {
        harga_komponen: 35,
        kerugian_komponen: 3700000000,
        suku_bunga: 10,
        waktu_sisa_operasi: 5,
        material_code: "6072060",
        material_description: "BOLT,MACHINE:5/8IN UNCX50.8MM;HEX;B7",
        abc_indikator: "B",
    };
    const responseBCR = await postFetch("/api/get/calc/manual", { model: "model bcr", items: itemBCR });
    console.log(responseBCR);
};

testing();
