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
        bcr: ["Material Code", "Material Description", "ABC Indicator", "Harga Komponen (Ho)", "Kerugian Komponen (Co)", "Suku Bunga (I)", "Waktu Sisa Operasi (tahun)"],
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

        if (element.name !== "material_code" && element.name !== "material_description" && element.name !== "abc_indikator") {
            element.classList.add("placeholder-red-500");
            notification("show", `Silakan lengkapi form ${element.name}`, "failed");
            status = "failed";
        }
    });

    if (status !== "success") {
        return;
    }

    const idProgress = progresBar(`Proses Kalkulasi`, `Model ${argModel}`, 5000);

    const response = await postFetch("/api/get/calc/manual", { model: modelSet[argModel], items: dataForm });

    const indikatorResult = {
        Q: ["Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", "Rata-Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", "Reorder Point (ROP) Unit", "Safety Stock (SS) Unit", "Frequensi Pemesanan (f)", "Ongkos Pembelian (Ob) /Tahun", "Ongkos Pemesanan (Op) /Tahun", "Ongkos Penyimpanan (Os) /Tahun", "Ongkos Kekurangan Inventori (Ok) /Tahun", "Ongkos Inventori (OT) /Tahun"],
        Poisson: ["Economic Order Quantity (EOQ) Lot Optimum (qo1)", "Nilai Alpha", "Ongkos Inventori (OT) /Tahun", "Reorder Point (ROP) Unit", "Safety Stock (SS) Unit", "Service Level (%)", "Standar Deviasi Waktu Ancang-Ancang (SL) Unit/Tahun"],
        Wilson: ["Frequensi Pemesanan (f)", "Lot Pengadaan (EOQ) Unit/Pesanan", "Ongkos Inventori (OT) /Tahun", "Ongkos Pembelian (Ob) /Tahun", "Ongkos Pemesanan (Op) /Tahun", "Ongkos Penyimpanan (Os) /Tahun", "Reorder Point (ROP) Unit", "Selang Waktu Pesan Kembali (Bulan)", "Selang Waktu Pesan Kembali (Hari)", "Selang Waktu Pesan Kembali (Tahun)"],
        Tchebycheff: ["Lot Pemesanan Optimal (q0)", "Nilai K Model Tchebycheff"],
        Regret: ["Harga Resale Komponen (O)", "Minimum Regret (Rp )", "Strategi Penyediaan Optimal (Unit)"],
        Linear: ["Harga Resale Komponen (O)", "Ongkos Model Probabilistik Kerusakan", "Strategi Penyediaan Optimal (Unit)"],
        NonLinear: ["Harga Resale Komponen (O)", "Ongkos Model Probabilistik Kerusakan", "Strategi Penyediaan Optimal (Unit)"],
        BCR: ["Benefit-Cost Ratio (BCR)", "Strategi Penyediaan Optimal (Tahun)", "Jenis Probabilitas", "Pesan"],
    };

    const resultCalc = document.getElementById("result-calc");

    resultModel = {};
    resultCalc.innerHTML = "";
    indikatorResult[argModel].map((item) => {
        resultCalc.innerHTML += `<div class="flex justify-between items-center gap-3 w-full text-xs">
            <div class="whitespace-nowrap">${item}</div>
            <div class="w-full flex items-center justify-center text-gray-300"><span class="h-[1px] min-w-20 w-full bg-gray-300"></span><span class="border-t-2 border-r-2 rotate-45 h-2 w-2"></span></div>
            <div class="py-2 w-fit px-2 border rounded text-right">${typeof response.data[item] === "number" ? formatNumber(response.data[item].toFixed(2)) : response.data[item] !== undefined ? response.data[item] : "N/A"}</div>
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

    if (data.model === "Wilson") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 165 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Permintaan Barang (D) Unit/Tahun", field: "Permintaan Barang (D) Unit/Tahun", minWidth: 240, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 175, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 175, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pembelian (Ob) /Tahun", field: "Ongkos Pembelian (Ob) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pemesanan (Op) /Tahun", field: "Ongkos Pemesanan (Op) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Penyimpanan (Os) /Tahun", field: "Ongkos Penyimpanan (Os) /Tahun", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lot Pengadaan (EOQ) Unit/Pesanan", field: "Lot Pengadaan (EOQ) Unit/Pesanan", minWidth: 240, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Selang Waktu Pesan Kembali (Hari)", field: "Selang Waktu Pesan Kembali (Hari)", minWidth: 245, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Selang Waktu Pesan Kembali (Bulan)", field: "Selang Waktu Pesan Kembali (Bulan)", minWidth: 250, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Selang Waktu Pesan Kembali (Tahun)", field: "Selang Waktu Pesan Kembali (Tahun)", minWidth: 250, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Q") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 160 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Rata - Rata Permintaan Barang (D) Unit/Tahun", field: "Rata - Rata Permintaan Barang (D) Unit/Tahun", minWidth: 330, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 150, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", field: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", minWidth: 355, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", field: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", minWidth: 330, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Safety Stock (SS) Unit", field: "Safety Stock (SS) Unit", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 180, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 185, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pembelian (Ob) /Tahun", field: "Ongkos Pembelian (Ob) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pemesanan (Op) /Tahun", field: "Ongkos Pemesanan (Op) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Penyimpanan (Os) /Tahun", field: "Ongkos Penyimpanan (Os) /Tahun", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kekurangan Inventori (Ok) /Tahun", field: "Ongkos Kekurangan Inventori (Ok) /Tahun", minWidth: 300, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", field: "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", minWidth: 350, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", field: "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", minWidth: 400, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", field: "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", minWidth: 420, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Poisson") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 155 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Rata-Rata Permintaan Barang (D) Unit/Tahun", field: "Rata-Rata Permintaan Barang (D) Unit/Tahun", minWidth: 310, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", field: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", minWidth: 340, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 150, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 165, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", field: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", minWidth: 320, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Nilai Alpha", field: "Nilai Alpha", minWidth: 100, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Service Level (%)", field: "Service Level (%)", minWidth: 140, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Safety Stock (SS) Unit", field: "Safety Stock (SS) Unit", minWidth: 165, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 175, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Economic Order Quantity (EOQ) Lot Optimum (qo1)", field: "Economic Order Quantity (EOQ) Lot Optimum (qo1)", minWidth: 335, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun", field: "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun", minWidth: 370, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Tchebycheff") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 160 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 165, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Kerugian Ketidakadaan Barang (Cu) /Unit", field: "Kerugian Ketidakadaan Barang (Cu) /Unit", minWidth: 280, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar Deviasi Permintaan Barang (s)", field: "Standar Deviasi Permintaan Barang (s)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Rata-Rata Permintaan Barang (alpha)", field: "Rata-Rata Permintaan Barang (alpha)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Nilai K Model Tchebycheff", field: "Nilai K Model Tchebycheff", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Lot Pemesanan Optimal (q0)", field: "Lot Pemesanan Optimal (q0)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Regret (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 160 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Minimum Regret (Rp )", field: "Minimum Regret (Rp )", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Linear (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 160 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 220, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Model Probabilistik Kerusakan", field: "Ongkos Model Probabilistik Kerusakan", minWidth: 260, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 240, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "Non Linear (Non Moving)") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 160 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 20, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 290, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Ongkos Model Probabilistik Kerusakan", field: "Ongkos Model Probabilistik Kerusakan", minWidth: 290, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        ];
    }

    if (data.model === "BCR") {
        columnDefs[aggridId] = [
            { headerName: "Material Code", field: "Material Code", minWidth: 120 },
            { headerName: "Material Description", field: "Material Description", minWidth: 185 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
            { headerName: "Harga Komponen (Ho)", field: "Harga Komponen (Ho)", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Kerugian Komponen (Co)", field: "Kerugian Komponen (Co)", minWidth: 195, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Suku Bunga (i)", field: "Suku Bunga (i)", minWidth: 130, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Waktu Sisa Operasi (tahun)", field: "Waktu Sisa Operasi (tahun)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Jenis Probabilitas", field: "Jenis Probabilitas", minWidth: 160, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Benefit-Cost Ratio (BCR)", field: "Benefit-Cost Ratio (BCR)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Strategi Penyediaan Optimal (Tahun)", field: "Strategi Penyediaan Optimal (Tahun)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
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
        Object.values(dataHasil).forEach((item) => (sheet.innerHTML += `<div id="sheet-${thisIdhasil}" onclick="aggridSheet(${item.id})" class="sheet-aggrid-tag w-fit px-4 py-2 whitespace-nowrap cursor-pointer hover:text-blue-700 hover:bg-gray-100 rounded-b duration-150">${item.model} | ${item.name}</div>`));
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
                            <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>

                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                    </div>
                    <div class="flex flex-col w-full">
                        <span>Material Description</span>
                        <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex gap-2">
                        <div class="flex flex-col">
                            <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                            <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                        </div>
                    </div>
                    <div class="flex gap-2">                    
                        <div class="flex flex-col">
                            <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                            <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Kekurangan Inventori (Cu) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_kekurangan_inventory_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Rata-Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="rata_rata_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Standar Deviasi Permintaan Barang (s) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="standar_deviasi_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Rata-Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="rata_rata_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex flex-col">
                    <div>Standar Deviasi Permintaan Barang (s) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="standar_deviasi_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kekurangan Inventori (Cu) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="ongkos_kekurangan_inventory_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                    <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Standar Deviasi Permintaan Barang (s) <span class="text-xs text-red-500">*</span></div>
                    <input name="standar_deviasi_permintaan_barang" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="standar deviasi" />
                </div>
                <div class="flex flex-col">
                    <div>Kerugian Ketidakadaan Barang (Cu) Unit <span class="text-xs text-red-500">*</span></div>
                    <input name="kerugian_ketidakadaan_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Rata-Rata Permintaan Barang (alpha) <span class="text-xs text-red-500">*</span></div>
                    <input name="rata_rata_permintaan_barang" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="alpha" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                    <input name="ongkos_pemakaian_komponen" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                    <input name="ongkos_kerugian_akibat_kerusakan" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                    <input name="jumlah_komponen_terpasang" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                    <input name="ongkos_pemakaian_komponen" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                    <input name="ongkos_kerugian_akibat_kerusakan" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                </div>
                <div class="flex flex-col">
                    <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                    <input name="jumlah_komponen_terpasang" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
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
                            <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span>Material Description</span>
                        <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Pemakaian Komponen (H) <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_pemakaian_komponen" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Kerugian Akibat Kerusakan (L) <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_kerugian_akibat_kerusakan" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                    <div class="flex flex-col">
                        <div>Jumlah Komponen Terpasang (m) <span class="text-xs text-red-500">*</span></div>
                        <input name="jumlah_komponen_terpasang" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="jumlah" />
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
                        <input name="material_code" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <h1>ABC Indicator</h1>
                        <input name="abc_indikator" type="text" class="py-2 w-64 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1>Material Description</h1>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Harga Komponen (Ho) <span class="text-xs text-red-500">*</span></h1>
                        <input name="harga_komponen" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="harga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Kerugian Komponen (Co) <span class="text-xs text-red-500">*</span></h1>
                        <input name="kerugian_komponen" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="kerugian" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Suku Bunga (I) <span class="text-xs text-red-500">*</span></h1>
                        <input name="suku_bunga" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="suku bunga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Waktu Sisa Operasi (tahun) <span class="text-xs text-red-500">*</span></h1>
                        <input name="waktu_sisa_operasi" oninput="numericInput(event)" type="text" class="py-2 w-64 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
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
