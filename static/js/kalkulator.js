const inpFile = document.getElementById("inp-file");

let idFile = 1;
let idHasil = 1;
let fileList = {};
let dataUnggah = [];
let dataHasil = {};
let modelSet = { Q: "model q", Wilson: "model wilson", Poisson: "model poisson", Tchebycheff: "model tchebycheff", "Regret (Non Moving)": "model non moving min max regret", "Linear (Non Moving)": "model non moving linear", "Non Linear (Non Moving)": "model non moving non linear", BCR: "model bcr", Regret: "model non moving min max regret", Linear: "model non moving linear", NonLinear: "model non moving non linear" };

const downloadTemplate = (agT) => {
    const dataTemplate = {
        wilson: ["Material Code", "Material Description", "ABC Indicator", "Permintaan Barang (D) Unit/Tahun", "Harga Barang (p) /Unit", "Ongkos Pesan (A) /Pesan", "Lead Time (L) Tahun", "Ongkos Simpan (h) /Unit/Tahun"],
        tchebycheff: ["Material Code", "Material Description", "ABC Indicator", "Harga Barang (p) /Unit", "Kerugian Ketidakadaan Barang (Cu) /Unit", "Standar Deviasi Permintaan Barang (s)", "Rata_Rata/Bulan"],
        q: ["Material Code", "Material Description", "ABC Indicator", "Rata-Rata Permintaan Barang (D) Unit/Tahun", "Lead Time (L) Tahun", "Standar Deviasi Permintaan Barang (s) Unit/Tahun", "Ongkos Pesan (A) /Pesan	Harga Barang (p) /Unit", "Ongkos Simpan (h) /Unit/Tahun", "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"],
        poisson: ["Material Code", "Material Description", "ABC Indicator", "Rata-Rata Permintaan Barang (D) Unit/Tahun", "Standar Deviasi Permintaan Barang (s) Unit/Tahun", "Lead Time (L) Tahun", "Ongkos Pesan (A) /Pesan", "Harga Barang (p) /Unit	Ongkos Simpan (h) /Unit/Tahun", "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"],
        nonmoving: ["Material Code", "Material Description", "ABC Indicator", "Ongkos Pemakaian Komponen (H)", "Ongkos Kerugian Akibat Kerusakan (L)", "Jumlah Komponen Terpasang (m)"],
        bcr: ["Material Code", "Material Description", "ABC Indicator", "Harga Komponen (Ho)", "Kerugian Komponen (Co)", "Suku Bunga (I)", "Waktu Sisa Operasi (tahun)", "Pola Probabilitas"],
    };

    const data = dataTemplate[agT];
    const worksheet = XLSX.utils.aoa_to_sheet([data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `template ${agT}.xlsx`);
};

const numericInput = (event) => (event.target.value = event.target.value.replace(/[^0-9.]/g, ""));

function formatNumber(value) {
    if (isNaN(value)) {
        throw new Error("Input harus berupa angka.");
    }

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const calcManual = async (argModel) => {
    let dataForm = {};
    let status = "success";

    document.querySelectorAll(`#calc${argModel} input`).forEach((element) => {
        if (element.value !== "") {
            dataForm[element.name] = element.value ? element.value : void 0;
            return;
        }

        if (element.name !== "code" && element.name !== "description" && element.name !== "indicator") {
            element.classList.add("placeholder-red-500");
            notification("show", `Silakan lengkapi form ${element.name}`, "failed");
            status = "failed";
        }
    });

    document.querySelectorAll(`#calc${argModel} select`).forEach((element) => {
        dataForm[element.name] = element.value ? element.value : void 0;
        return;
    });

    if (status !== "success") {
        return;
    }

    const idProgress = progresBar(`Proses Kalkulasi`, `Model ${argModel}`, 5000);

    const response = await postFetch("/api/get/calc/manual", { model: modelSet[argModel], items: dataForm });

    if (argModel === "Poisson" && response.data.message !== "") {
        popupContent("show", '<div class="p-6 bg-white rounded-lg shadow text-center border border-sky-300" >Silakan cek kembali parameter yang dimasukan,<br />kemudian hitung ulang agar tidak menghasilkan negative</div>', "blur");
    }

    const indikatorResult = {
        Wilson: ["Frequensi Pemesanan (f)", "Ongkos Pembelian /Tahun (Ob)", "Ongkos Pemesanan /Tahun (Op)", "Ongkos Penyimpanan /Tahun (Os)", "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", "Re-Order Point ROP /Unit (r)", "Selang Waktu /Hari (T)", "Ongkos Inventori Total /Tahun"],
        Q: ["Iterasi", "Standar Deviasi Lead Time Unit/Tahun (SL)", "Rata-Rata Permintaan Lead Time Unit/Tahun (DL)", "Frequensi Pemesanan (f)", "Ongkos Pembelian (Ob) /Tahun", "Ongkos Pemesanan (Op) /Tahun", "Ongkos Penyimpanan (Os) /Tahun", "Ongkos Kekurangan Inventori (Ok) /Tahun", "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", "Reorder Point ROP /Unit (r)", "Safety Stock /Unit (ss)", "Ongkos Inventori Total /Tahun (OT)", "Tingkat Pelayanan %"],
        Poisson: ["Iterasi", "Nilai Alpha (a)", "Standar Deviasi Waktu Ancang-ancang Unit/Tahun (SL)", "Economic Order Quantity EOQ Unit/Pesanan (qo)", "Reorder Point ROP /Unit (r)", "Safety Stock /Unit (ss)", "Ongkos Inventori /Tahun (OT)", "Tingkat pelayanan % (n)"],
        Tchebycheff: ["Nilai K Model Tchebycheff", "Ukuran Lot Penyediaan (qo)"],
        Regret: ["Harga Resale Rp/Unit/Hari (O)", "Ekspetasi Ongkos Inventory Minimum /Rp", "Ukuran Lot Penyediaan /Unit (qi)"],
        Linear: ["Harga Resale Rp/Unit/Hari (O)", "Ekspetasi Ongkos Inventory Minimum /Rp", "Ukuran Lot Penyediaan /Unit (qi)"],
        NonLinear: ["Harga Resale Rp/Unit/Hari (O)", "Ekspetasi Ongkos Inventory Minimum /Rp", "Ukuran Lot Penyediaan /Unit (qi)"],
        BCR: ["Ongkos Pemakaian /Unit (Ht)", "Kerugian Komponen /Unit (Ct)", "Probabilitas Kerusakan P(t)", "Ekspektasi Benefit (Bt)", "Benefit Cost Ration", "Remark"],
    };

    const resultCalc = document.getElementById("result-calc");

    resultModel = {};
    resultCalc.innerHTML = "";
    indikatorResult[argModel].map((item) => {
        resultCalc.innerHTML += `<div class="flex justify-between items-center gap-3 w-full text-xs">
            <div class="whitespace-nowrap">${item}</div>
            <div class="w-full flex items-center justify-center text-gray-300"><span class="h-[1px] min-w-20 w-full bg-gray-300"></span><span class="border-t-2 border-r-2 rotate-45 h-2 w-2"></span></div>
            <div class="py-2 w-fit px-2 border rounded text-right whitespace-nowrap">${typeof response.data[item] === "number" ? formatNumber(response.data[item].toFixed(2)) : response.data[item] !== undefined ? response.data[item] : "N/A"}</div>
        </div>`;
    });

    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
};

const uploadFile = async () => {
    tools("unggah");

    setTimeout(() => {
        [...inpFile.files].map((file) => {
            const idFileNow = idFile;
            const row = {
                id: idFileNow,
                name: file.name,
                model: "Wilson",
                action: `<div class="flex gap-1 items-center cursor-pointer bg-transparent hover:bg-red-300 rounded px-2 overflow-hidden">
                        <img src="./static/assets/delete-red.png" alt="delete" class="w-4 h-4" />
                        <span class="text-red-500">Hapus</span>
                    </div>`,
                proses: `<div class="flex gap-1 items-center cursor-pointer bg-transparent hover:bg-blue-300 rounded px-2 overflow-hidden">
                        <img src="./static/assets/play-blue.png" alt="delete" class="w-4 h-4" />
                        <span class="text-blue-500">Hitung</span>
                    </div>`,
                status: `<div class="flex gap-1 items-center cursor-pointer">
                        <img src="./static/assets/pause-gray.png" alt="pause" class="w-4 h-4" />
                        <span class="text-gray-500">Belum diproses</span>
                    </div>`,
            };

            dataUnggah.push(row);
            fileList[idFileNow] = file;
            idFile = idFileNow + 1;

            notification("show", "File berhasil diunggah", "success");

            gridApi.unggah.applyTransaction({ add: [row] });
        });
        datasetAgGrid.unggah = dataUnggah;
    }, 500);
};

const prosesFile = async (agData) => {
    const idProgress = progresBar("Proses Data", `Hitung model Kalkulator`, fileList[agData.id].size / 100);
    const idHasilNow = idHasil;
    const response = await postFiles("/api/get/calc/file", fileList[agData.id], agData.id, modelSet[agData.model]);

    if (response.status !== "success") {
        notification("show", response.message, "failed");
        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        return ["failed"];
    }

    !dataHasil[idHasilNow] ? (dataHasil[idHasilNow] = { data: [], model: "", name: "", id: "" }) : "";
    dataHasil[idHasilNow].id = idHasilNow;
    dataHasil[idHasilNow].data = response.data;
    dataHasil[idHasilNow].model = agData.model;
    dataHasil[idHasilNow].name = fileList[agData.id].name;

    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
    idHasil = idHasil + 1;
    return ["success", idHasilNow];
};

const aggridSheet = (agD) => {
    const data = Object.values(dataHasil).filter((item) => item.id == agD)[0];
    const aggridId = `${data.model}`;

    document.querySelectorAll(".sheet-aggrid-tag").forEach((item) => item.classList.remove("bg-blue-50", "text-blue-700"));
    document.getElementById(`sheet-${agD}`).classList.add("bg-blue-50", "text-blue-700");

    const returnFloat = (params) => {
        const num = params.value;
        if (!num) {
            return "";
        }
        return parseFloat(num).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const comparatorGrid = (valueA, valueB) => {
        return valueA - valueB;
    };

    const returnPersen = (params) => {
        return `${params.value * 100}%`;
    };

    const returnString = (params) => {
        return `${params.value}`;
    };

    const returnStrPersen = (params) => {
        const num = params.value;
        if (!num) {
            return "";
        }
        return `${parseFloat(num).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} %`;
    };

    if (data.model === "Wilson") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 165 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Harga Barang Rp/Unit (p)", field: "Harga Barang Rp/Unit (p)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pesan Rp/Unit (A)", field: "Ongkos Pesan Rp/Unit (A)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Simpan Barang Rp/Unit/Tahun (h)", field: "Ongkos Simpan Barang Rp/Unit/Tahun (h)", minWidth: 225, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Rata-Rata Permintaan Barang Unit/Tahun (D)", field: "Rata-Rata Permintaan Barang Unit/Tahun (D)", minWidth: 250, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Lead Time /Tahun (L)", field: "Lead Time /Tahun (L)", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Data Proses",
                children: [
                    { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 195, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pembelian /Tahun (Ob)", field: "Ongkos Pembelian /Tahun (Ob)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pemesanan /Tahun (Op)", field: "Ongkos Pemesanan /Tahun (Op)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Penyimpanan /Tahun (Os)", field: "Ongkos Penyimpanan /Tahun (Os)", minWidth: 240, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Output",
                children: [
                    { headerName: "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", field: "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", minWidth: 255, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Re-Order Point ROP /Unit (r)", field: "Re-Order Point ROP /Unit (r)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Selang Waktu /Hari (T)", field: "Selang Waktu /Hari (T)", minWidth: 255, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Inventori Total /Tahun", field: "Ongkos Inventori Total /Tahun", minWidth: 265, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
        ];
    }

    if (data.model === "Q") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Harga Barang Rp/Unit (p)", field: "Harga Barang Rp/Unit (p)", minWidth: 175, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pesan Rp/Pesan (A)", field: "Ongkos Pesan Rp/Pesan (A)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Simpan Barang Rp/Unit/Tahun (h)", field: "Ongkos Simpan Barang Rp/Unit/Tahun (h)", minWidth: 225, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Kekurangan Barang Rp/Unit (Cu)", field: "Ongkos Kekurangan Barang Rp/Unit (Cu)", minWidth: 330, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Rata-Rata Permintaan Unit/Tahun (D)", field: "Rata-Rata Permintaan Unit/Tahun (D)", minWidth: 330, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Standar Deviasi Permintaan Barang Unit/Tahun (s)", field: "Standar Deviasi Permintaan Barang Unit/Tahun (s)", minWidth: 355, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Lead Time /Tahun (L)", field: "Lead Time /Tahun (L)", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Data Proses",
                children: [
                    { headerName: "Iterasi", field: "Iterasi", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Standar Deviasi Lead Time Unit/Tahun (SL)", field: "Standar Deviasi Lead Time Unit/Tahun (SL)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Rata-Rata Permintaan Lead Time Unit/Tahun (DL)", field: "Rata-Rata Permintaan Lead Time Unit/Tahun (DL)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pembelian (Ob) /Tahun", field: "Ongkos Pembelian (Ob) /Tahun", minWidth: 230, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pemesanan (Op) /Tahun", field: "Ongkos Pemesanan (Op) /Tahun", minWidth: 300, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Penyimpanan (Os) /Tahun", field: "Ongkos Penyimpanan (Os) /Tahun", minWidth: 410, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Kekurangan Inventori (Ok) /Tahun", field: "Ongkos Kekurangan Inventori (Ok) /Tahun", minWidth: 435, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Output",
                children: [
                    { headerName: "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", field: "Lot Pengadaan Barang EOQ Unit/Pesanan (qo)", minWidth: 360, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Reorder Point ROP /Unit (r)", field: "Reorder Point ROP /Unit (r)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Safety Stock /Unit (ss)", field: "Safety Stock /Unit (ss)", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Inventori Total /Tahun (OT)", field: "Ongkos Inventori Total /Tahun (OT)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Tingkat Pelayanan %", field: "Tingkat Pelayanan %", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
        ];
    }

    if (data.model === "Poisson") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 155 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Harga Barang Rp/Unit (p)", field: "Harga Barang Rp/Unit (p)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Pesan Rp/Pesan (A)", field: "Ongkos Pesan Rp/Pesan (A)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Simpan Rp/Unit/Tahun (h)", field: "Ongkos Simpan Rp/Unit/Tahun (h)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Kekurangan Rp/Unit (Cu)", field: "Ongkos Kekurangan Rp/Unit (Cu)", minWidth: 250, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Rata-Rata Permintaan Unit/Tahun (D)", field: "Rata-Rata Permintaan Unit/Tahun (D)", minWidth: 280, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Standar Deviasi Permintaan Unit/Tahun (s)", field: "Standar Deviasi Permintaan Unit/Tahun (s)", minWidth: 320, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Lead Time /tahun (L)", field: "Lead Time /tahun (L)", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Data Proses",
                children: [
                    { headerName: "Iterasi", field: "Iterasi", minWidth: 80 },
                    { headerName: "Nilai Alpha (a)", field: "Nilai Alpha (a)", minWidth: 120, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Standar Deviasi Waktu Ancang-ancang Unit/Tahun (SL)", field: "Standar Deviasi Waktu Ancang-ancang Unit/Tahun (SL)", minWidth: 380, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            {
                headerName: "Output",
                children: [
                    { headerName: "Economic Order Quantity EOQ Unit/Pesanan (qo)", field: "Economic Order Quantity EOQ Unit/Pesanan (qo)", minWidth: 250, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Reorder Point ROP /Unit (r)", field: "Reorder Point ROP /Unit (r)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Safety Stock /Unit (ss)", field: "Safety Stock /Unit (ss)", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ongkos Inventori /Tahun (OT)", field: "Ongkos Inventori /Tahun (OT)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Tingkat pelayanan % (n)", field: "Tingkat pelayanan % (n)", minWidth: 185, cellClass: "justify-end", valueFormatter: (params) => returnStrPersen(params) },
                ],
            },
        ];
    }

    if (data.model === "Tchebycheff") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Ongkos pemakaian Rp/Unit/Hari (p)", field: "Ongkos pemakaian Rp/Unit/Hari (p)", minWidth: 185, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Akibat Kerusakan Rp/Unit/Hari (Cu)", field: "Kerugian Akibat Kerusakan Rp/Unit/Hari (Cu)", minWidth: 300, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Rata-Rata Permintaan Barang Unit/Tahun (a)", field: "Rata-Rata Permintaan Barang Unit/Tahun (a)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Standar Deviasi Permintaan Barang Unit/Tahun (s)", field: "Standar Deviasi Permintaan Barang Unit/Tahun (s)", minWidth: 280, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            { headerName: "Data Proses", children: [{ headerName: "Nilai K Model Tchebycheff", field: "Nilai K Model Tchebycheff", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) }] },
            { headerName: "Output", children: [{ headerName: "Ukuran Lot Penyediaan (qo)", field: "Ukuran Lot Penyediaan (qo)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) }] },
        ];
    }

    if (data.model === "Regret (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Ongkos Pemakaian Rp/Unit/Tahun (H)", field: "Ongkos Pemakaian Rp/Unit/Tahun (H)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", field: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Jumlah Komponen Terpasang /Unit (m)", field: "Jumlah Komponen Terpasang /Unit (m)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            { headerName: "Data Proses", children: [{ headerName: "Harga Resale Rp/Unit/Hari (O)", field: "Harga Resale Rp/Unit/Hari (O)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) }] },
            {
                headerName: "Output",
                children: [
                    { headerName: "Ekspetasi Ongkos Inventory Minimum /Rp", field: "Ekspetasi Ongkos Inventory Minimum /Rp", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ukuran Lot Penyediaan /Unit (qi)", field: "Ukuran Lot Penyediaan /Unit (qi)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
        ];
    }

    if (data.model === "Linear (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Ongkos Pemakaian Rp/Unit/Tahun (H)", field: "Ongkos Pemakaian Rp/Unit/Tahun (H)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", field: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Jumlah Komponen Terpasang /Unit (m)", field: "Jumlah Komponen Terpasang /Unit (m)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            { headerName: "Data Proses", children: [{ headerName: "Harga Resale Rp/Unit/Hari (O)", field: "Harga Resale Rp/Unit/Hari (O)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) }] },
            {
                headerName: "Output",
                children: [
                    { headerName: "Ekspetasi Ongkos Inventory Minimum /Rp", field: "Ekspetasi Ongkos Inventory Minimum /Rp", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ukuran Lot Penyediaan /Unit (qi)", field: "Ukuran Lot Penyediaan /Unit (qi)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
        ];
    }

    if (data.model === "Non Linear (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Ongkos Pemakaian Rp/Unit/Tahun (H)", field: "Ongkos Pemakaian Rp/Unit/Tahun (H)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", field: "Kerugian Akibat Kerusakan Rp/Unit/Hari (L)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Jumlah Komponen Terpasang /Unit (m)", field: "Jumlah Komponen Terpasang /Unit (m)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            { headerName: "Data Proses", children: [{ headerName: "Harga Resale Rp/Unit/Hari (O)", field: "Harga Resale Rp/Unit/Hari (O)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) }] },
            {
                headerName: "Output",
                children: [
                    { headerName: "Ekspetasi Ongkos Inventory Minimum /Rp", field: "Ekspetasi Ongkos Inventory Minimum /Rp", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ukuran Lot Penyediaan /Unit (qi)", field: "Ukuran Lot Penyediaan /Unit (qi)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
        ];
    }

    if (data.model === "BCR") {
        columnDefs[aggridId] = [
            { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 185 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            {
                headerName: "Parameter Input",
                children: [
                    { headerName: "Harga Komponen /Unit (Ho)", field: "Harga Komponen /Unit (Ho)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Komponen /Unit (Co)", field: "Kerugian Komponen /Unit (Co)", minWidth: 225, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Suku Bunga /Tahun (i)", field: "Suku Bunga /Tahun (i)", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnPersen(params) },
                    { headerName: "Sisa Operasi /Tahun (N)", field: "Sisa Operasi /Tahun (N)", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Jenis Probabilitas", field: "Pola Probabilitas (P)", minWidth: 150 },
                ],
            },
            {
                headerName: "Data Proses",
                children: [
                    { headerName: "Ongkos Pemakaian /Unit (Ht)", field: "Ongkos Pemakaian /Unit (Ht)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Kerugian Komponen /Unit (Ct)", field: "Kerugian Komponen /Unit (Ct)", minWidth: 230, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Probabilitas Kerusakan P(t)", field: "Probabilitas Kerusakan P(t)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Ekspektasi Benefit (Bt)", field: "Ekspektasi Benefit (Bt)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                    { headerName: "Benefit Cost Ration", field: "Benefit Cost Ration", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
                ],
            },
            { headerName: "Output", children: [{ headerName: "Remark", field: "Remark", minWidth: 155, valueFormatter: (params) => returnString(params) }] },
        ];
    }

    datasetAgGrid[aggridId] = data.data;

    document.getElementById("btnCsv").setAttribute("data", aggridId);
    document.getElementById("inpSearch").setAttribute("data", aggridId);

    setupAggrid(`aggrid-hasil`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsUnggah = (header, headerAction, childContent) => {
    const aggridId = "unggah";
    header.textContent = "List File Terunggah";
    headerAction.innerHTML = `<div class="relative group">
        <span class="border border-blue-500 py-2 px-4 rounded text-sm cursor-pointer group-hover:bg-blue-500 group-hover:text-white group-hover:border-transparent">Unduh Template</span>
        <div class="absolute top-0 right-0 pt-8 z-50">
            <div class="bg-white shadow-lg py-2 px-4 hidden group-hover:flex flex-col gap-2">
                <button onclick="downloadTemplate('q')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Q</button>
                <button onclick="downloadTemplate('wilson')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Wilsonn</button>
                <button onclick="downloadTemplate('poisson')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Poisson</button>
                <button onclick="downloadTemplate('tchebycheff')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Tchybeef</button>
                <button onclick="downloadTemplate('nonmoving')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Regret (Non-Moving)</button>
                <button onclick="downloadTemplate('nonmoving')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Linear (Non-Moving)</button>
                <button onclick="downloadTemplate('nonmoving')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model Non-Linear (Non-Moving)</button>
                <button onclick="downloadTemplate('bcr')" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-xs whitespace-nowrap text-left">Model BCR</button>
            </div>
        </div>
    </div>

    `;

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <h1 class="font-medium text-lg text-blue-900">File Terunggah</h1>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

    const aggridValueChanged = (event) => {
        event.colDef.field === "model" ? (dataUnggah.find((item) => item.id === event.data.id).model = event.data.model) : "";
    };

    const aggridCellRenderer = (params) => {
        const span = document.createElement("span");
        span.innerHTML = params.value;
        span.addEventListener("click", async () => {
            const rowIndex = params.node.rowIndex;
            const index = dataUnggah.findIndex((item) => item.id === params.data.id);
            if (index !== -1) {
                dataUnggah.splice(index, 1);
            }

            delete dataHasil[params.data.id];
            gridApi.unggah.applyTransaction({ remove: [params.data] });
        });
        return span;
    };

    const aggridCellRendererProses = (params) => {
        const span = document.createElement("span");
        span.innerHTML = params.value;

        span.addEventListener("click", async () => {
            const pross = await prosesFile(params.data);
            if (pross[0] === "success") {
                dataUnggah.find((item) => item.id === params.data.id).status = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/done-green.png" alt="delete" class="w-4 h-4" /><span class="text-green-500">Berhasil</span></div>`;
                tools("hasil", pross[1]);
            } else {
                dataUnggah.find((item) => item.id === params.data.id).status = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/error-yellow.png" alt="delete" class="w-4 h-4" /><span class="text-yellow-500">Gagal</span></div>`;
            }
        });

        return span;
    };

    const aggridCellRendererStatus = (params) => {
        return params.value;
    };

    columnDefs[aggridId] = [
        { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
        { headerName: "NAMA", field: "name", minWidth: 150 },
        { headerName: "Model", field: "model", editable: true, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["Q", "Wilson", "Poisson", "Tchebycheff", "Regret (Non Moving)", "Linear (Non Moving)", "Non Linear (Non Moving)", "BCR"] }, onCellValueChanged: (event) => aggridValueChanged(event), minWidth: 150 },
        { headerName: "AKSI", field: "action", cellRenderer: (params) => aggridCellRenderer(params), minWidth: 100, maxWidth: 100 },
        { headerName: "", field: "proses", cellRenderer: (params) => aggridCellRendererProses(params), minWidth: 100, maxWidth: 100 },
        { headerName: "STATUS", field: "status", futoHeight: true, cellRenderer: (params) => aggridCellRendererStatus(params), minWidth: 150 },
    ];

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsHasil = (header, headerAction, childContent, agD) => {
    const aggridId = "hasil";
    header.textContent = "Hasil Kalkulator Model";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="relative w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-xs">
            <div class="flex gap-2 items-center"></div>
            <div class="flex gap-2 justify-between items-center">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
        <div class="bottom-0 left-0 px-2 border-t w-full overflow-x-scroll"><div id="sheet-aggrid" class="flex w-fit text-sm"></div></div>
    </div>`;

    let thisIdhasil = agD ? agD : "";

    if (Object.keys(dataHasil).length > 0) {
        const sheet = document.getElementById("sheet-aggrid");
        sheet.innerHTML = "";
        thisIdhasil = Object.keys(dataHasil)[0];
        Object.values(dataHasil).forEach((item) => (sheet.innerHTML += `<div id="sheet-${item.id}" onclick="aggridSheet(${item.id})" class="sheet-aggrid-tag w-fit px-4 py-2 whitespace-nowrap cursor-pointer hover:text-blue-700 hover:bg-gray-100 rounded-b duration-150">${item.model} | ${item.name}</div>`));
        aggridSheet(thisIdhasil);
    }
};

const toolsQ = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
            <div class="flex flex-col gap-3 w-fit h-fit">
                <h1 class="font-medium text-lg text-blue-900 mb-4">Model Q</h1>
                <form id="calcQ" class="flex flex-col gap-4 calc-model text-xs">
                    <div class="flex gap-2">
                        <div class="flex flex-col">
                            <span>Material Code</span>
                            <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>

                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                    </div>
                    <div class="flex flex-col w-full">
                        <span>Material Description</span>
                        <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex gap-2">
                        <div class="flex flex-col">
                            <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                            <input name="p" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                        </div>
                    </div>
                    <div class="flex gap-2">                    
                        <div class="flex flex-col">
                            <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="h" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                            <input name="A" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Kekurangan Inventori (Cu) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="Cu" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Rata-Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="D" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Standar Deviasi Permintaan Barang (s) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="s" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                </form>

                <div class="flex gap-4 items-center mt-4">
                    <span class="w-full h-[1px] bg-gray-300"></span>
                    <button onclick="calcManual('Q')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
                </div>

                <div id="result-calc" class="w-fit flex flex-col gap-4"></div>
            </div>
        </div>`;
};

const toolWilson = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model Wilson</h1>
            <form id="calcWilson" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <span>Material Code</span>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="p" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="h" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="A" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="D" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('Wilson')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const toolsPoisson = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model Poisson</h1>
            <form id="calcPoisson" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <span>Material Code</span>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="p" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Rata-Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="D" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex flex-col">
                    <div>Standar Deviasi Permintaan Barang (s) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="s" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="A" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="h" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kekurangan Inventori (Cu) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="Cu" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('Poisson')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const toolsTchebycheff = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model Tchebycheff</h1>
            <form id="calcTchebycheff" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <span>Material Code</span>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                    <input name="p" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Standar Deviasi Permintaan Barang (s) <span class="text-xs text-red-500">*</span></div>
                    <input name="s" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="standar deviasi" />
                </div>
                <div class="flex flex-col">
                    <div>Kerugian Ketidakadaan Barang (Cu) Unit <span class="text-xs text-red-500">*</span></div>
                    <input name="Cu" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Rata-Rata Permintaan Barang (alpha) <span class="text-xs text-red-500">*</span></div>
                    <input name="a" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="alpha" />
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('Tchebycheff')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const toolsNonMovingMinRegret = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model Regret (Non-Moving)</h1>
            <form id="calcRegret" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <span>Material Code</span>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                    <input name="H" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                    <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                    <input name="m" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('Regret')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const toolsNonMovingLinear = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model Linear (Non-Moving)</h1>
            <form id="calcLinear" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <span>Material Code</span>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                    <input name="H" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                    <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                    <input name="m" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('Linear')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const toolsNonMovingNonLinear = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
            <div class="flex flex-col gap-3 w-fit h-fit">
                <h1 class="font-medium text-lg text-blue-900 mb-4">Model Non-Linear (Non-Moving)</h1>
                <form id="calcNonLinear" class="flex flex-col gap-4 calc-model text-xs">
                    <div class="flex gap-2">
                        <div class="flex flex-col">
                            <span>Material Code</span>
                            <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span>Material Description</span>
                        <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                        <input name="H" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                        <input name="L" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                    <div class="flex flex-col">
                        <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                        <input name="m" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
                    </div>
                </form>

                <div class="flex gap-4 items-center mt-4">
                    <span class="w-full h-[1px] bg-gray-300"></span>
                    <button onclick="calcManual('NonLinear')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
                </div>

                <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
            </div>
        </div>`;
};

const toolsBcr = (header, headerAction, childContent) => {
    header.textContent = "Model Manual";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 overflow-y-scroll">
        <div class="flex flex-col gap-3 w-fit h-fit">
            <h1 class="font-medium text-lg text-blue-900 mb-4">Model BCR (Non-Moving)</h1>
            <form id="calcBCR" class="flex flex-col gap-4 calc-model text-xs">
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Material Code</h1>
                        <input name="code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <h1>ABC Indicator</h1>
                        <input name="indicator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1>Material Description</h1>
                    <input name="description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Harga Komponen (Ho) <span class="text-xs text-red-500">*</span></h1>
                        <input name="Ho" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="harga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Kerugian Komponen (Co) <span class="text-xs text-red-500">*</span></h1>
                        <input name="Co" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="kerugian" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Suku Bunga (I) <span class="text-xs text-red-500">*</span></h1>
                        <input name="i" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="suku bunga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Waktu Sisa Operasi (tahun) <span class="text-xs text-red-500">*</span></h1>
                        <input name="N" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Pola Probabilitas <span class="text-xs text-red-500">*</span></h1>
                        <select name="P" class="py-2 w-64 px-2 border rounded">
                            <option value="uniform">Uniform</option>
                            <option value="linear">Linear</option>
                            <option value="hiperbolik">Hiperbolik</option>
                            <option value="kuadratis">Kuadratis</option>
                            <option value="kubik">Kubik</option>
                        </select>
                    </div>
                </div>
            </form>

            <div class="flex gap-4 items-center mt-4">
                <span class="w-full h-[1px] bg-gray-300"></span>
                <button onclick="calcManual('BCR')" class="bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded text-sm whitespace-nowrap text-left duration-150">Hitung Model</button>
            </div>

            <div id="result-calc" class="w-fit flex flex-col gap-2"></div>
        </div>
    </div>`;
};

const tools = (agT, agD) => {
    const header = document.getElementById("header");
    const headerAction = document.getElementById("header-action");
    const childContent = document.getElementById("child-content");

    childTools.querySelectorAll(`.tools`).forEach((element) => {
        element.classList.remove("bg-sky-500");
        element.classList.add("hover:bg-sky-500");
        element.classList.remove("text-white");
        element.classList.add("hover:text-white");
    });

    const toolsSelected = childTools.querySelector(`.${agT}`);
    toolsSelected.classList.remove("hover:bg-sky-500");
    toolsSelected.classList.add("bg-sky-500");
    toolsSelected.classList.remove("hover:text-white");
    toolsSelected.classList.add("text-white");

    childContent.innerHTML = "";

    url.searchParams.set("t", agT);
    window.history.replaceState({}, "", url.toString());

    agT === "unggah" ? toolsUnggah(header, headerAction, childContent) : "";
    agT === "hasil" ? toolsHasil(header, headerAction, childContent, agD) : "";
    agT === "q" ? toolsQ(header, headerAction, childContent) : "";
    agT === "wilson" ? toolWilson(header, headerAction, childContent) : "";
    agT === "poisson" ? toolsPoisson(header, headerAction, childContent) : "";
    agT === "tchebycheff" ? toolsTchebycheff(header, headerAction, childContent) : "";
    agT === "regret" ? toolsNonMovingMinRegret(header, headerAction, childContent) : "";
    agT === "linear" ? toolsNonMovingLinear(header, headerAction, childContent) : "";
    agT === "non-linear" ? toolsNonMovingNonLinear(header, headerAction, childContent) : "";
    agT === "bcr" ? toolsBcr(header, headerAction, childContent) : "";
};

document.addEventListener("DOMContentLoaded", () => {
    setHeight();

    const ParamTools = urlParams.get("t");
    if (ParamTools) {
        tools(ParamTools);
    } else {
        url.searchParams.set("t", "unggah");
        window.history.replaceState({}, "", url.toString());
        tools("unggah");
    }

    inpFile.onchange = () => uploadFile(0);

    setTimeout(() => miniNav(), 300);
});
