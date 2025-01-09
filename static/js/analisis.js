const inpFile = document.getElementById("inp-file");
const lblFile = document.getElementById("lbl-file");

let session = sessionStorage.getItem("session");
if (!session) {
    let now = new Date();
    sessionStorage.setItem("session", now.getTime());
    session = sessionStorage.getItem("session");
}

let fileOnProcess = true;
let dataListFile = {};

let fileId = 0;
let dataList = [];
let dataMentah = {};
let idProduct = 1;
// let dataSubset = [];
// let dataClass = [];
// let dataModel = {};
// let processingButton = {};
// let intElement = "new";

const runAllFile = async () => {
    fileOnProcess = false;

    const response = await await postFetch("/api/get/analysis/proses", { session: session });
    if (response[0] !== "processing") {
        notification("show", "proses gagal", "failed");
        return;
    }

    let merge;
    do {
        merge = await postFetch("/api/get/result", { session: session, field: "merge" });
        if (merge.status !== "success") {
            console.log("Retrying in 1 second...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (merge.status !== "success");

    let classification;
    do {
        classification = await postFetch("/api/get/result", { session: session, field: "classification" });
        if (classification.status !== "success") {
            console.log("Retrying in 1 second...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (classification.status !== "success");

    let model;
    do {
        model = await postFetch("/api/get/result", { session: session, field: "model" });
        if (model.status !== "success") {
            console.log("Retrying in 1 second...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (model.status !== "success");

    console.log(merge);
    console.log(classification);
    console.log(model);
};

const uploadFile = async (agN) => {
    if (!fileOnProcess) {
        return;
    } else {
        fileOnProcess = false;
        lblFile.style.cursor = "not-allowed";
        inpFile.disabled = true;
    }

    try {
        const fileIdNow = agN + 1;
        const file = inpFile.files[agN];
        const times = file.size / 100;
        const eksistensi = file.name.split(".").pop().toLowerCase();
        const idProgress = progresBar("Baca data histori Good Issue (GI)", `${file.name}`, times);

        indikatorNavigation("list", "P");

        const missData = (message) => {
            sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
            indikatorNavigation("list", "D");
            notification("show", message, "failed");
            fileOnProcess = true;
            uploadFile(agN + 1);
            return;
        };

        eksistensi !== "xls" && eksistensi !== "XLS" && eksistensi !== "xlsx" && eksistensi !== "XLSX" ? missData(`${file.name} tidak diizinkan`) : "";
        const response = await postFiles("/api/push/analysis/file", file, fileIdNow, session);
        response.status !== "success" ? missData(response.message) : "";

        let statusAggrid = ``;
        if (response.status === "success") {
            statusAggrid = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/done-green.png" alt="delete" class="w-4 h-4" /><span class="text-green-500">Terunggah</span></div>`;
            dataMentah[file.name] = response.data;
            notification("show", `${file.name} berhasil diunggah`, "success");
        } else {
            notification("show", `${file.name} gagal diunggah`, "failed");
            statusAggrid = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/error-yellow.png" alt="delete" class="w-4 h-4" /><span class="text-yellow-500">Gagal</span></div>`;
        }

        dataList.push({
            name: file.name,
            size: `${file.size / 1000}`,
            action: `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/delete-red.png" alt="delete" class="w-4 h-4" /><span class="text-red-500">Hapus</span></div>`,
            status: statusAggrid,
            id: fileIdNow,
        });

        tools("list");

        if (inpFile.files.length !== agN + 1) {
            fileOnProcess = true;
            sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
            uploadFile(agN + 1);
            return;
        }

        fileOnProcess = true;
        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        indikatorNavigation("list", "D");
    } catch (error) {
        notification("show", "Gagal upload file", "failed");
        console.log(error);
    }
};

const toolsList = (header, headerAction, childContent) => {
    const aggridId = "list";
    header.textContent = "List File";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="font-medium text-lg text-blue-900 flex justify-between items-center">
            <h1>File Terunggah</h1>
            <button id="btn-proses" btn-id="new" class="relative px-6 py-2 overflow-hidden font-medium text-sky-700 bg-sky-50 border border-gray-100 rounded-lg group focus:scale-95 duration-150 shadow">
                <span class="absolute top-0 left-0 w-0 h-0 transition-all duration-200 border-t-2 border-sky-700 group-hover:w-full ease"></span>
                <span class="absolute bottom-0 right-0 w-0 h-0 transition-all duration-200 border-b-2 border-sky-700 group-hover:w-full ease"></span>
                <span class="absolute top-0 left-0 w-full h-0 transition-all duration-300 delay-200 bg-sky-700 group-hover:h-full ease"></span>
                <span class="absolute bottom-0 left-0 w-full h-0 transition-all duration-300 delay-200 bg-sky-700 group-hover:h-full ease"></span>
                <span class="absolute inset-0 w-full h-full duration-300 delay-300 bg-sky-700 opacity-0 group-hover:opacity-100"></span>
                <div class="relative font-semibold transition-colors duration-300 delay-200 group-hover:text-white ease text-sm flex gap-1">
                <h2>Proses Semua File</h2>
                    <img src="/static/assets/proses-blue.png" alt="proses" class="w-5 h-5 duration-300 delay-200 group-hover:w-0 group-hover:h-0" />
                    <img src="/static/assets/proses-white.png" alt="proses" class="w-0 h-0 duration-300 delay-200 group-hover:w-5 group-hover:h-5" />
                </div>
            </button>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

    const btnProses = document.getElementById("btn-proses");
    btnProses.onclick = () => runAllFile();

    const aggridCellRenderer = (params) => {
        const span = document.createElement("span");
        span.innerHTML = params.value;
        span.addEventListener("click", async () => {
            const rowIndex = params.node.rowIndex;
            const index = dataList.findIndex((item) => item.name === params.data.name);
            if (index !== -1) {
                dataList.splice(index, 1);
            }
            console.log(params);
            const response = await postFetch("/api/delete/analysis/file", { file_id: params.data.id, session: session });

            if (response.status === "success") {
                notification("show", "File berhasil terhapus", "success");
                delete dataMentah[params.data.name];
                gridApi[aggridId].applyTransaction({ remove: [params.data] });
            } else {
                notification("show", response.message, "failed");
            }
        });
        return span;
    };

    const aggridCellRendererStatus = (params) => {
        return params.value;
    };

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

    columnDefs[aggridId] = [
        { headerName: "id", field: "id", hide: true },
        { headerName: "NAMA", field: "name" },
        { headerName: "UKURAN /KB", field: "size", minWidth: 150, maxWidth: 200, valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "AKSI", field: "action", cellRenderer: (params) => aggridCellRenderer(params), minWidth: 150, maxWidth: 200 },
        { headerName: "STATUS", field: "status", futoHeight: true, cellRenderer: (params) => aggridCellRendererStatus(params), minWidth: 150, maxWidth: 200 },
    ];

    datasetAgGrid[aggridId] = dataList;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const tools = (agT) => {
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

    agT === "list" ? toolsList(header, headerAction, childContent) : "";

    if (agT === "mentah") {
        header.textContent = "Data Mentah";
        headerAction.innerHTML = "";

        let option = Object.keys(dataMentah).map((key) => {
            return `<option value='${key}'>${key}</option>`;
        });

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div class="flex gap-2 items-center">
                    <span>Nama File: </span>
                    <select id="slc-mentah" class="cursor-pointer bg-transparent">${option}</select>
                </div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        try {
            columnDefs.mentah = Object.keys(dataMentah[document.getElementById("slc-mentah").value][0]).map((key) => {
                const lenght = key.length >= 20 ? key.length * 8 : key.length >= 15 ? key.length * 9 : key.length >= 10 ? key.length * 10 : key.length * 12;
                return {
                    headerName: key,
                    field: key,
                    minWidth: lenght,
                    cellRenderer: (params) => {
                        return params.value;
                    },
                };
            });

            document.getElementById("slc-mentah").addEventListener("change", () => {
                columnDefs.mentah = Object.keys(dataMentah[document.getElementById("slc-mentah").value][0]).map((key) => {
                    const lenght = key.length >= 20 ? key.length * 8 : key.length >= 15 ? key.length * 9 : key.length >= 10 ? key.length * 10 : key.length * 12;
                    return {
                        headerName: key,
                        field: key,
                        minWidth: lenght,
                        cellRenderer: (params) => {
                            return params.value;
                        },
                    };
                });

                setupAggrid(dataMentah[document.getElementById("slc-mentah").value], columnDefs.mentah, false);
            });

            !processingButton.mentah ? (processingButton.mentah = "allow") : void 0;
            if (processingButton.mentah === "allow") {
                headerAction.innerHTML = `<button id="btn-process-mentah" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded text-xs">Proses Dataframe</button>`;
                document.getElementById("btn-process-mentah").addEventListener("click", () => {
                    headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Sedang Memproses Dataframe</button>`;
                    processingButton.mentah = "processing";
                    subset();
                });
            } else if (processingButton.mentah === "processing") {
                headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Sedang Memproses Dataframe</button>`;
            } else {
                headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Proses Selesai</button>`;
            }
        } catch (error) {
            columnDefs.mentah = [
                { headerName: "Base Unit of Measure", field: "code" },
                { headerName: "Material", field: "code" },
                { headerName: "Material.1", field: "code" },
                { headerName: "Movement Type", field: "code" },
                { headerName: "Posting Date", field: "code" },
                { headerName: "Purchase Order", field: "code" },
            ];
        }

        setupAggrid(dataMentah[document.getElementById("slc-mentah").value], columnDefs.mentah, false);
    }

    if (agT === "subset") {
        header.textContent = "Subset Data";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Subset Data</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.subset = [
            { headerName: "Posting Date", field: "Posting Date", minWidth: 150 },
            { headerName: "Material Code", field: "Material_Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "Quantity(EA)", field: "Quantity(EA)", minWidth: 150 },
            { headerName: "Movement Type", field: "Movement Type", minWidth: 150 },
        ];

        setupAggrid(dataSubset, columnDefs.subset, false);
    }

    if (agT === "class") {
        header.textContent = "Data Klasifikasi";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between">
                <div class="flex gap-2 items-center text-sm">
                    <span>Data Klasifikasi: </span>
                    <select onchange="dataFilter(event)" class="cursor-pointer bg-transparent">
                        <option value="">Semua</option>
                        <option value="Deterministik">Pola Deterministik</option>
                        <option value="Normal">Pola Normal</option>
                        <option value="Poisson">Pola Poisson</option>
                        <option value="Tak - Tentu">Pola Tak - Tentu</option>
                    </select>
                </div>
                <div class="flex gap-2 justify-between items-center  text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.filtered = [
            { headerName: "Material Code", field: "Material_Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "Kategori", field: "Kategori", minWidth: 150, filter: true },
            { headerName: "Proses 1", field: "Proses1", minWidth: 150 },
            { headerName: "Proses 2", field: "Proses2", minWidth: 150 },
            { headerName: "Jumlah Data", field: "Jumlah_Data", minWidth: 150 },
            { headerName: "Rata-Rata", field: "Rata_Rata", minWidth: 150 },
            { headerName: "Variansi", field: "Variansi", minWidth: 150 },
            { headerName: "Standar Deviasi", field: "Standar_Deviasi", minWidth: 150 },
            { headerName: "P Value", field: "P_Value", minWidth: 150 },
            { headerName: "Deskripsi Pengujian Statistik", field: "Deskripsi_Pengujian_Statistik", minWidth: 150 },
            { headerName: "Hasil Uji", field: "Hasil_uji", minWidth: 150 },
        ];

        if (dataClass.length !== 0) {
            !processingButton.class ? (processingButton.class = "allow") : void 0;
            if (processingButton.class === "allow") {
                headerAction.innerHTML = `<button id="btn-process-model" class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded text-xs">Proses Tiap Kategori</button>`;
                document.getElementById("btn-process-model").addEventListener("click", () => {
                    headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Sedang Memproses</button>`;
                    processingButton.class = "processing";
                    model();
                });
            } else if (processingButton.class === "processing") {
                headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Sedang Memproses</button>`;
            } else {
                headerAction.innerHTML = `<button class="cursor-not-allowed bg-blue-500 font-semibold text-white py-2 px-4 border border-blue-500 border-transparent rounded text-xs">Proses Selesai</button>`;
            }
        }

        setupAggrid(dataClass, columnDefs.filtered, false);
    }

    if (agT === "q") {
        header.textContent = "Model Q (Pola Normal)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Q</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.q = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Rata - Rata Permintaan Barang (D) Unit/Tahun", field: "Rata - Rata Permintaan Barang (D) Unit/Tahun", minWidth: 150 },
            { headerName: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", field: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", minWidth: 150 },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 150 },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 150 },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 150 },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 150 },
            { headerName: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", field: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", minWidth: 150 },
            { headerName: "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", field: "Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", minWidth: 150 },
            { headerName: "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", field: "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", minWidth: 150 },
            { headerName: "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", field: "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", minWidth: 150 },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 150 },
            { headerName: "Safety Stock (SS) Unit", field: "Safety Stock (SS) Unit", minWidth: 150 },
            { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 150 },
            { headerName: "Ongkos Pembelian (Ob) /Tahun", field: "Ongkos Pembelian (Ob) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Pemesanan (Op) /Tahun", field: "Ongkos Pemesanan (Op) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Penyimpanan (Os) /Tahun", field: "Ongkos Penyimpanan (Os) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Kekurangan Inventori (Ok) /Tahun", field: "Ongkos Kekurangan Inventori (Ok) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 150 },
        ];

        setupAggrid(dataModel.q, columnDefs.q, false);
    }

    if (agT === "wilson") {
        header.textContent = "Model Wilson (Pola Deterministik)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Wilson</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.wilson = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Permintaan Barang (D) Unit/Tahun", field: "Permintaan Barang (D) Unit/Tahun", minWidth: 150 },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 150 },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 150 },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 150 },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 150 },
            { headerName: "Lot Pengadaan (EOQ) Unit/Pesanan", field: "Lot Pengadaan (EOQ) Unit/Pesanan", minWidth: 150 },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 150 },
            { headerName: "Selang Waktu Pesan Kembali (Tahun)", field: "Selang Waktu Pesan Kembali (Tahun)", minWidth: 150 },
            { headerName: "Selang Waktu Pesan Kembali (Bulan)", field: "Selang Waktu Pesan Kembali (Bulan)", minWidth: 150 },
            { headerName: "Selang Waktu Pesan Kembali (Hari)", field: "Selang Waktu Pesan Kembali (Hari)", minWidth: 150 },
            { headerName: "Frequensi Pemesanan (f)", field: "Frequensi Pemesanan (f)", minWidth: 150 },
            { headerName: "Ongkos Pembelian (Ob) /Tahun", field: "Ongkos Pembelian (Ob) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Pemesanan (Op) /Tahun", field: "Ongkos Pemesanan (Op) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Penyimpanan (Os) /Tahun", field: "Ongkos Penyimpanan (Os) /Tahun", minWidth: 150 },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 150 },
        ];

        setupAggrid(dataModel.wilson, columnDefs.wilson, false);
    }

    if (agT === "poisson") {
        header.textContent = "Model Poisson (Pola Poisson)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Poisson</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.poisson = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Rata - Rata Permintaan Barang (D) Unit/Tahun", field: "Rata - Rata Permintaan Barang (D) Unit/Tahun", minWidth: 150 },
            { headerName: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", field: "Standar Deviasi Permintaan Barang (s) Unit/Tahun", minWidth: 150 },
            { headerName: "Lead Time (L) Tahun", field: "Lead Time (L) Tahun", minWidth: 150 },
            { headerName: "Ongkos Pesan (A) /Pesan", field: "Ongkos Pesan (A) /Pesan", minWidth: 150 },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 150 },
            { headerName: "Ongkos Simpan (h) /Unit/Tahun", field: "Ongkos Simpan (h) /Unit/Tahun", minWidth: 150 },
            { headerName: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", field: "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun", minWidth: 150 },
            { headerName: "Nilai Alpha", field: "Nilai Alpha", minWidth: 150 },
            { headerName: "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun", field: "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun", minWidth: 150 },
            { headerName: "Economic Order Quantity (EOQ) Lot Optimum (qo1)", field: "Economic Order Quantity (EOQ) Lot Optimum (qo1)", minWidth: 150 },
            { headerName: "Reorder Point (ROP) Unit", field: "Reorder Point (ROP) Unit", minWidth: 150 },
            { headerName: "Safety Stock (SS) Unit", field: "Safety Stock (SS) Unit", minWidth: 150 },
            { headerName: "Service Level (%)", field: "Service Level (%)", minWidth: 150 },
            { headerName: "Ongkos Inventori (OT) /Tahun", field: "Ongkos Inventori (OT) /Tahun", minWidth: 150 },
        ];

        setupAggrid(dataModel.poisson, columnDefs.poisson, false);
    }

    if (agT === "tchebycheff") {
        header.textContent = "Model Tchebycheff (Pola Tak - Tentu)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Tchebycheff</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.tchebycheff = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Harga Barang (p) /Unit", field: "Harga Barang (p) /Unit", minWidth: 150 },
            { headerName: "Kerugian Ketidakadaan Barang (Cu) /Unit", field: "Kerugian Ketidakadaan Barang (Cu) /Unit", minWidth: 150 },
            { headerName: "Standar Deviasi Permintaan Barang (s)", field: "Standar Deviasi Permintaan Barang (s)", minWidth: 150 },
            { headerName: "Rata - Rata Permintaan Barang (alpha)", field: "Rata - Rata Permintaan Barang (alpha)", minWidth: 150 },
            { headerName: "Nilai K Model Tchebycheff", field: "Nilai K Model Tchebycheff", minWidth: 150 },
            { headerName: "Lot Pemesanan Optimal (q0)", field: "Lot Pemesanan Optimal (q0)", minWidth: 150 },
        ];

        setupAggrid(dataModel.tchebycheff, columnDefs.tchebycheff, false);
    }

    if (agT === "regret") {
        header.textContent = "Model Regret (Pola Non Moving)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Regret</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.regret = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 150 },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 150 },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 150 },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 150 },
            { headerName: "Minimum Regret (Rp )", field: "Minimum Regret (Rp )", minWidth: 150 },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 150 },
        ];

        setupAggrid(dataModel.regret, columnDefs.regret, false);
    }

    if (agT === "linear") {
        header.textContent = "Model Linear (Pola Non Moving)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Linear</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.linear = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 150 },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 150 },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 150 },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 150 },
            { headerName: "Ongkos Model Probabilistik Kerusakan", field: "Ongkos Model Probabilistik Kerusakan", minWidth: 150 },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 150 },
        ];

        setupAggrid(dataModel.linear, columnDefs.linear, false);
    }

    if (agT === "non-linear") {
        header.textContent = "Model Non Linear (Pola Non Moving)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div>Data Hasil Model Non Linear</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.nonlinear = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 150 },
            { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 150 },
            { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 150 },
            { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 150 },
            { headerName: "Ongkos Model Probabilistik Kerusakan", field: "Ongkos Model Probabilistik Kerusakan", minWidth: 150 },
            { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 150 },
        ];

        setupAggrid(dataModel.nonlinear, columnDefs.nonlinear, false);
    }

    if (agT === "bcr") {
        header.textContent = "Model BCR (Pola BCR)";
        headerAction.innerHTML = "";

        childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between  text-sm">
                <div>Data Hasil Model BCR</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-website" class="ag-theme-quartz w-full h-full"></div>
        </div>`;

        columnDefs.bcr = [
            { headerName: "Material Code", field: "Material Code", minWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 150 },
            { headerName: "Harga Komponen (Ho)", field: "Harga Komponen (Ho)", minWidth: 150 },
            { headerName: "Kerugian Komponen (Co)", field: "Kerugian Komponen (Co)", minWidth: 150 },
            { headerName: "Suku Bunga (i)", field: "Suku Bunga (i)", minWidth: 150 },
            { headerName: "Waktu Sisa Operasi (tahun)", field: "Waktu Sisa Operasi (tahun)", minWidth: 150 },
            { headerName: "Benefit-Cost Ratio (BCR)", field: "Benefit-Cost Ratio (BCR)", minWidth: 150 },
            { headerName: "Strategi Penyediaan Optimal (Tahun)", field: "Strategi Penyediaan Optimal (Tahun)", minWidth: 150 },
            { headerName: "Jenis Probabilitas", field: "Jenis Probabilitas", minWidth: 150 },
            { headerName: "Pesan", field: "Pesan", minWidth: 150 },
        ];

        setupAggrid(dataModel.bcr, columnDefs.bcr, false);
    }
};

// const subset = async () => {
//     indikatorNavigation("mentah", "P");
//     intElement = "old";
//     let lengData = 0;

//     if (!upProxFile) {
//         return;
//     } else {
//         upProxFile = false;
//         lblFile.style.cursor = "not-allowed";
//         inpFile.disabled = true;
//     }

//     Object.values(dataMentah).map((item) => (lengData += item.length));

//     let times = Object.values(dataMentah).reduce((sum, data) => sum + data.length, 0) * 2;
//     const idProgress = progresBar("Filterisasi Data", "Normalisasi data Input Histori Good Issue (GI)", times);

//     const responseSubset = await postFetch("subset", { session: sId });

//     if (responseSubset[0] !== "processing") {
//         notification("show", "Gagal mengolah data", "failed");
//         sInterval[idProgress] = "done";
//         return;
//     }

//     let intervalId;
//     const pollSubset = () => {
//         intervalId = setInterval(async () => {
//             try {
//                 const getSubset = await postFetch("/get-result-subset", { session: sId });

//                 if (getSubset[0] === "success") {
//                     clearInterval(intervalId);
//                     sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");

//                     dataSubset = getSubset[1];
//                     indikatorNavigation("mentah", "D");
//                     tools("subset");
//                     processingButton.mentah = "done";
//                     filtered();
//                 } else {
//                     console.log("Masih memproses...");
//                 }
//             } catch (error) {
//                 console.error("Error:", error);
//                 clearInterval(intervalId);
//             }
//         }, 3000);
//     };

//     pollSubset();
// };

// const filtered = async () => {
//     let times = dataSubset.length;
//     indikatorNavigation("subset", "P");

//     const idProgress = progresBar("Filterisasi Data", "Filtering data Histori Good Issue (GI)", times);

//     const responseClass = await postFetch("classification", { session: sId });

//     if (responseClass[0] !== "success") {
//         notification("show", "Gagal mengolah data", "failed");
//         sInterval[idProgress] = "done";
//         return;
//     }

//     sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");

//     upProxFile = true;
//     lblFile.style.cursor = "pointer";
//     inpFile.disabled = false;

//     dataClass = responseClass[1];
//     processingButton.class = "allow";
//     indikatorNavigation("subset", "D");
//     indikatorNavigation("class", "D");
//     tools("class");
// };

// const model = async () => {
//     let times = dataClass.length;
//     indikatorNavigation("class", "P");

//     if (!upProxFile) {
//         return;
//     } else {
//         upProxFile = false;
//         lblFile.style.cursor = "not-allowed";
//         inpFile.disabled = true;
//     }

//     const idProgress = progresBar("Filterisasi Data", "Filtering data Histori Good Issue (GI)", times);

//     const responseModel = await postFetch("model-to-calc", { session: sId });

//     if (responseModel[0] !== "success") {
//         notification("show", "Gagal mengolah data", "failed");
//         sInterval[idProgress] = "done";
//         processingButton.class = "done";

//         upProxFile = true;
//         lblFile.style.cursor = "pointer";
//         inpFile.disabled = false;
//         return;
//     }

//     sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");

//     dataModel = responseModel[1];
//     indikatorNavigation("class", "D");
//     Object.entries(dataModel).map((item) => (item[1].length !== 0 ? (indikatorNavigation(item[0], "D"), tools(item[0])) : void 0));
//     processingButton.class = "done";

//     upProxFile = true;
//     lblFile.style.cursor = "pointer";
//     inpFile.disabled = false;
// };

// const dataFilter = (event) => {
//     gridApi.setFilterModel({
//         Kategori: {
//             type: "contains",
//             filter: event.target.value,
//         },
//     });

//     gridApi.onFilterChanged();
// };

// const inpSearch = (event) => searchData(event.target.value);

document.addEventListener("DOMContentLoaded", async () => {
    setHeight();

    const ParamTools = urlParams.get("t");
    if (ParamTools) {
        tools(ParamTools);
    } else {
        url.searchParams.set("t", "list");
        window.history.replaceState({}, "", url.toString());
        tools("list");
    }

    inpFile.onchange = () => uploadFile(0);
    setTimeout(() => miniNav(), 300);
});
