const inpFile = document.getElementById("inp-file");
const lblFile = document.getElementById("lbl-file");

let fileStatusToProses = true;
let dataListFile = {};

let idFileMentah = 1;
let dataList = [];
let dataMentah = {};
let idProduct = 1;
let dataSubset = [];
let dataClass = {};
let dataModel = {};

const runAllFile = async () => {
    const btnProses = document.getElementById("btn-proses");

    fileStatusToProses = false;
    btnProses.disabled = true;
    btnProses.classList.add("cursor-not-allowed");
    lblFile.style.cursor = "not-allowed";
    inpFile.disabled = true;
    document.querySelector("#btn-proses h2").textContent = "Sedang Proses";

    const indikatorProses = ["subset", "class", "q", "wilson", "poisson", "tchebycheff", "regret", "linear", "non-linear", "bcr"];
    indikatorProses.forEach((item) => indikatorNavigation(item, "P"));

    const response = await postFetch("/api/get/analysis/proses", { session: session });
    if (response[0] !== "processing") {
        notification("show", "proses gagal", "failed");
        return;
    }

    let idProgress = progresBar("Normalisasi data Input Histori Good Issue (GI)", "Proses Data", dataList.length * 5000);
    setTimeout(() => {
        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        idProgress = progresBar("Filtering data Histori Good Issue (GI)", "Proses Data", dataList.length * 6000);
        setTimeout(() => {
            sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
            idProgress = progresBar("Agregasi Data", "Proses Data", dataList.length * 60000);
        }, dataList.length * 6000);
    }, dataList.length * 5000);

    let merge;
    do {
        merge = await postFetch("/api/get/result", { session: session, field: "merge" });
        if (merge.status !== "success") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (merge.status !== "success");
    dataSubset = merge.data;
    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
    idProgress = progresBar("Klasifikasi Materia dan Identifikasi Pola Distribusi", "Proses Data", merge.data.length / 1.5);
    indikatorNavigation("subset", "D");
    tools("subset");

    let classification;
    do {
        classification = await postFetch("/api/get/result", { session: session, field: "classification" });
        if (classification.status !== "success") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (classification.status !== "success");
    classification.data.forEach((item) => {
        !dataClass[item.Kategori] ? (dataClass[item.Kategori] = []) : "";
        dataClass[item.Kategori].push(item);
    });
    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
    idProgress = progresBar("Perhitungan Model Inventory", "Proses Data", 5000);
    indikatorNavigation("class", "D");
    tools("class");

    let model;
    do {
        model = await postFetch("/api/get/result", { session: session, field: "model" });
        if (model.status !== "success") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (model.status !== "success");
    dataModel = model.data;
    indikatorProses.forEach((item) => indikatorNavigation(item, "D"));
    tools("q");
    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");

    fileStatusToProses = true;
    btnProses.disabled = false;
    btnProses.classList.remove("cursor-not-allowed");
    lblFile.style.cursor = "pointer";
    inpFile.disabled = false;
};

const uploadFile = async (index) => {
    if (!fileStatusToProses) {
        return;
    } else {
        fileStatusToProses = false;
        lblFile.style.cursor = "not-allowed";
        inpFile.disabled = true;
    }

    try {
        const file = inpFile.files[index];
        const times = file.size / 100;
        const eksistensi = file.name.split(".").pop().toLowerCase();
        const idProgress = progresBar("Baca data histori Good Issue (GI)", `${file.name}`, times);
        indikatorNavigation("list", "P");

        const missData = (message) => {
            indikatorNavigation("list", "D");
            notification("show", message, "failed");
            sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
            fileStatusToProses = true;
            lblFile.style.cursor = "pointer";
            inpFile.disabled = false;
            idFileMentah = idFileMentah + 1;
            uploadFile(index + 1);
            return;
        };

        eksistensi !== "xls" && eksistensi !== "XLS" && eksistensi !== "xlsx" && eksistensi !== "XLSX" ? missData(`${file.name} tidak diizinkan`) : "";
        const response = await postFiles("/api/push/analysis/file", file, idFileMentah, session);
        response.status !== "success" ? missData(response.message) : "";

        let statusAggrid = ``;
        if (response.status === "success") {
            statusAggrid = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/done-green.png" alt="delete" class="w-4 h-4" /><span class="text-green-500">Terunggah</span></div>`;
            dataMentah[idFileMentah] = { id: idFileMentah, name: file.name, data: response.data };
            notification("show", `${file.name} berhasil diunggah`, "success");
        } else {
            notification("show", `${file.name} gagal diunggah`, "failed");
            statusAggrid = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/error-yellow.png" alt="delete" class="w-4 h-4" /><span class="text-yellow-500">Gagal</span></div>`;
        }

        dataList.push({ name: file.name, size: `${file.size / 1000}`, action: `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/delete-red.png" alt="delete" class="w-4 h-4" /><span class="text-red-500">Hapus</span></div>`, status: statusAggrid, id: idFileMentah });

        if (inpFile.files.length !== index + 1) {
            fileStatusToProses = true;
            lblFile.style.cursor = "pointer";
            inpFile.disabled = false;
            sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
            idFileMentah = idFileMentah + 1;
            uploadFile(index + 1);
            return;
        }

        fileStatusToProses = true;
        lblFile.style.cursor = "pointer";
        inpFile.disabled = false;
        idFileMentah = idFileMentah + 1;

        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        indikatorNavigation("list", "D");
        indikatorNavigation("mentah", "D");

        tools("mentah");
    } catch (error) {
        notification("show", "Gagal upload file", "failed");
        console.log(error);
    }
};

const aggridSheet = (agD) => {
    const data = Object.values(dataMentah).filter((item) => item.id == agD)[0];
    const aggridId = `mentah-${data.id}`;

    document.querySelectorAll(".sheet-aggrid-tag").forEach((item) => item.classList.remove("bg-blue-50", "text-blue-700"));
    document.getElementById(`sheet-${agD}`).classList.add("bg-blue-50", "text-blue-700");

    columnDefs[aggridId] = [];

    Object.keys(data.data[0]).forEach((item) => {
        const lenght = item.length >= 20 ? item.length * 8 : item.length >= 15 ? item.length * 9 : item.length >= 10 ? item.length * 10 : item.length * 12;
        columnDefs[aggridId].push({
            headerName: item,
            field: item,
            minWidth: lenght,
            cellRenderer: (params) => {
                return params.value;
            },
        });
    });

    datasetAgGrid[aggridId] = data.data;

    document.getElementById("btnCsv").setAttribute("data", aggridId);
    document.getElementById("inpSearch").setAttribute("data", aggridId);

    setupAggrid(`aggrid-mentah`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const aggridSheetClass = (agD) => {
    document.getElementById("class-subtitle").textContent = agD;
    const data = dataClass[agD];
    const dataPola = { "Pola Tak - Tentu": "tchebycheff", "Pola Deterministik": "wilson", "Pola Poisson": "poisson", "Pola Normal": "q", "Pola Non Moving": "nonmoving" };
    const aggridId = `class-${dataPola[agD]}`;

    document.querySelectorAll(".sheet-aggrid-tag").forEach((item) => item.classList.remove("bg-blue-50", "text-blue-700"));
    document.getElementById(`sheet-${dataPola[agD]}`).classList.add("bg-blue-50", "text-blue-700");

    const returnFloat = (params) => {
        const num = params.value;
        if (!num) {
            return 0;
        }
        return parseFloat(num).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const comparatorGrid = (valueA, valueB) => {
        return valueA - valueB;
    };

    const valueGetterGrid = (params) => {
        const value = params.data["Variansi"];
        return isNaN(value) || value === "" ? 0 : value;
    };

    columnDefs[aggridId] = [
        { headerName: "Material_Code", field: "Material_Code", minWidth: 140 },
        { headerName: "Material Description", field: "Material Description", minWidth: 200 },
        { headerName: "Jumlah_Data", field: "Jumlah_Data", minWidth: 130, cellClass: "justify-center" },
        { headerName: "Kategori", field: "Kategori", minWidth: 110 },
        { headerName: "Proses1", field: "Proses1", minWidth: 100 },
        { headerName: "Proses2", field: "Proses2", minWidth: 100 },
        { headerName: "P_Value", field: "P_Value", minWidth: 100, cellClass: "justify-end", valueGetter: (params) => valueGetterGrid(params), valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Variansi", field: "Variansi", minWidth: 110, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Rata_Rata", field: "Rata_Rata", minWidth: 120, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Standar_Deviasi", field: "Standar_Deviasi", minWidth: 150, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Hasil_uji", field: "Hasil_uji", minWidth: 120 },
        { headerName: "Deskripsi_Pengujian_Statistik", field: "Deskripsi_Pengujian_Statistik", minWidth: 250 },
    ];

    datasetAgGrid[aggridId] = data;

    document.getElementById("btnCsv").setAttribute("data", aggridId);
    document.getElementById("inpSearch").setAttribute("data", aggridId);

    setupAggrid(`aggrid-class`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsList = (header, headerAction, childContent) => {
    const aggridId = "list";
    header.textContent = "List File";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="font-medium text-lg text-blue-900 flex justify-between items-center">
            <h1>File Terunggah</h1>
            <button id="btn-proses" btn-id="new" ${!fileStatusToProses ? "disabled" : ""} class="${!fileStatusToProses ? "cursor-not-allowed" : ""} relative px-6 py-2 overflow-hidden font-medium text-sky-700 bg-sky-50 border border-gray-100 rounded-lg group focus:scale-95 duration-150 shadow">
                <span class="absolute top-0 left-0 w-0 h-0 transition-all duration-200 border-t-2 border-sky-700 group-hover:w-full ease"></span>
                <span class="absolute bottom-0 right-0 w-0 h-0 transition-all duration-200 border-b-2 border-sky-700 group-hover:w-full ease"></span>
                <span class="absolute top-0 left-0 w-full h-0 transition-all duration-300 delay-200 bg-sky-700 group-hover:h-full ease"></span>
                <span class="absolute bottom-0 left-0 w-full h-0 transition-all duration-300 delay-200 bg-sky-700 group-hover:h-full ease"></span>
                <span class="absolute inset-0 w-full h-full duration-300 delay-300 bg-sky-700 opacity-0 group-hover:opacity-100"></span>
                <div class="relative font-semibold transition-colors duration-300 delay-200 group-hover:text-white ease text-sm flex gap-1">
                <h2>${fileStatusToProses ? "Proses Semua File" : "Sedang Proses"}</h2>
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
            if (!fileStatusToProses) {
                notification("show", "data sedang di proses", "failed");
                return;
            }

            const rowIndex = params.node.rowIndex;
            const index = dataList.findIndex((item) => item.name === params.data.name);
            if (index !== -1) {
                dataList.splice(index, 1);
            }
            console.log(params);
            const response = await postFetch("/api/delete/analysis/file", { file_id: params.data.id, session: session });

            if (response.status === "success") {
                notification("show", "File berhasil terhapus", "success");
                delete dataMentah[params.data.id];
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

const toolsMentah = (header, headerAction, childContent) => {
    const aggridId = "mentah";
    header.textContent = "Data Mentah";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
            <div class="w-full flex justify-between text-sm">
                <div class="flex gap-2 items-center">Data Mentah</div>
                <div class="flex gap-2 justify-between items-center text-xs">
                    <span>Cari Data</span>
                    <input oninput="inpSearch(event)" data="" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                    <button onclick="downloadCsv(event)" data="" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
                </div>
            </div>
            <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
            <div class="bottom-0 left-0 px-2 border-t w-full overflow-x-scroll pb-2"><div id="sheet-aggrid" class="flex w-fit text-sm"></div></div>
        </div>`;

    if (Object.keys(dataMentah).length > 0) {
        const sheet = document.getElementById("sheet-aggrid");
        sheet.innerHTML = "";
        Object.values(dataMentah).forEach((item) => (sheet.innerHTML += `<div id="sheet-${item.id}" onclick="aggridSheet(${item.id})" class="sheet-aggrid-tag w-fit px-4 py-2 whitespace-nowrap cursor-pointer hover:text-blue-700 hover:bg-gray-100 rounded-b duration-150">${item.name}</div>`));
        thisIdhasil = Object.keys(dataMentah)[0];
        aggridSheet(thisIdhasil);
    } else {
        columnDefs["kosong"] = [
            { headerName: "Posting Date", field: "Posting Date", minWidth: 150, maxWidth: 150, valueGetter: (params) => aggridValueGetter(params), valueFormatter: (params) => aggridValueFormatter(params) },
            { headerName: "Material Code", field: "Material_Code", minWidth: 150, maxWidth: 150 },
            { headerName: "Material Description", field: "Material Description", minWidth: 150 },
            { headerName: "Quantity(EA)", field: "Quantity(EA)", minWidth: 150, maxWidth: 150, cellClass: "justify-center", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Movement Type", field: "Movement Type", minWidth: 150, maxWidth: 150, cellClass: "justify-center" },
        ];

        setupAggrid(`aggrid-mentah`, datasetAgGrid["kosong"], columnDefs["kosong"], "kosong");
    }
};

const toolsSubset = (header, headerAction, childContent) => {
    const aggridId = "subset";
    header.textContent = "Subset Data";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Subset Data</div>
            <div class="flex gap-2 justify-between items-center text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

    const aggridValueGetter = (params) => {
        return new Date(params.data["Posting Date"]);
    };

    const aggridValueFormatter = (params) => {
        const date = new Date(params.value);
        return date.toISOString().split("T")[0];
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
        { headerName: "Posting Date", field: "Posting Date", minWidth: 150, maxWidth: 150, valueGetter: (params) => aggridValueGetter(params), valueFormatter: (params) => aggridValueFormatter(params) },
        { headerName: "Material Code", field: "Material_Code", minWidth: 150, maxWidth: 150 },
        { headerName: "Material Description", field: "Material Description", minWidth: 150 },
        { headerName: "Quantity(EA)", field: "Quantity(EA)", minWidth: 150, maxWidth: 150, cellClass: "justify-center", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Movement Type", field: "Movement Type", minWidth: 150, maxWidth: 150, cellClass: "justify-center" },
    ];

    if (dataSubset.length > 0) {
        datasetAgGrid[aggridId] = dataSubset;
    }

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsClass = (header, headerAction, childContent) => {
    const aggridId = "class";
    header.textContent = "Data Klasifikasi";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between">
            <div id="class-subtitle" class="flex gap-2 items-center text-sm"></div>
            <div class="flex gap-2 justify-between items-center text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
        <div class="bottom-0 left-0 px-2 border-t w-full overflow-x-scroll pb-2"><div id="sheet-aggrid" class="flex w-fit text-sm"></div></div>
    </div>`;

    if (Object.keys(dataClass).length > 0) {
        const sheet = document.getElementById("sheet-aggrid");
        sheet.innerHTML = "";
        const dataPola = { "Pola Tak - Tentu": "tchebycheff", "Pola Deterministik": "wilson", "Pola Poisson": "poisson", "Pola Normal": "q", "Pola Non Moving": "nonmoving" };
        const nameSheet = ["Pola Deterministik", "Pola Poisson", "Pola Normal", "Pola Tak - Tentu", "Pola Non Moving"];
        nameSheet.forEach((item) => (sheet.innerHTML += `<div id="sheet-${dataPola[item]}" onclick="aggridSheetClass('${item}')" class="sheet-aggrid-tag w-fit px-4 py-2 whitespace-nowrap cursor-pointer hover:text-blue-700 hover:bg-gray-100 rounded-b duration-150">${item}</div>`));
        aggridSheetClass("Pola Deterministik");
    } else {
        columnDefs["kosong"] = [
            { headerName: "Material_Code", field: "Material_Code", minWidth: 140 },
            { headerName: "Material Description", field: "Material Description", minWidth: 200 },
            { headerName: "Jumlah_Data", field: "Jumlah_Data", minWidth: 130, cellClass: "justify-center" },
            { headerName: "Kategori", field: "Kategori", minWidth: 110 },
            { headerName: "Proses1", field: "Proses1", minWidth: 100 },
            { headerName: "Proses2", field: "Proses2", minWidth: 100 },
            { headerName: "P_Value", field: "P_Value", minWidth: 100, cellClass: "justify-end", valueGetter: (params) => valueGetterGrid(params), valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Variansi", field: "Variansi", minWidth: 110, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Rata_Rata", field: "Rata_Rata", minWidth: 120, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Standar_Deviasi", field: "Standar_Deviasi", minWidth: 150, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
            { headerName: "Hasil_uji", field: "Hasil_uji", minWidth: 120 },
            { headerName: "Deskripsi_Pengujian_Statistik", field: "Deskripsi_Pengujian_Statistik", minWidth: 250 },
        ];

        setupAggrid(`aggrid-class`, datasetAgGrid["kosong"], columnDefs["kosong"], "kosong");
    }
};

const toolsQ = (header, headerAction, childContent) => {
    const aggridId = "modelq";
    header.textContent = "Model Q (Pola Normal)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Q</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.q;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsWilson = (header, headerAction, childContent) => {
    const aggridId = "modelwilson";
    header.textContent = "Model Wilson (Pola Deterministik)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Wilson</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.wilson;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsPoisson = (header, headerAction, childContent) => {
    const aggridId = "modelpoisson";
    header.textContent = "Model Poisson (Pola Poisson)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Poisson</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.poisson;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsTchebycheff = (header, headerAction, childContent) => {
    const aggridId = "modeltchebycheff";
    header.textContent = "Model Tchebycheff (Pola Tak - Tentu)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Tchebycheff</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.tchebycheff;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsRegret = (header, headerAction, childContent) => {
    const aggridId = "modelRegret";
    header.textContent = "Model Regret (Pola Non Moving)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Regret</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.nonmovingregret;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsLinear = (header, headerAction, childContent) => {
    const aggridId = "modellinear";
    header.textContent = "Model Linear (Pola Non Moving)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Linear</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    datasetAgGrid[aggridId] = dataModel.nonmovinglinear;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsNonLinear = (header, headerAction, childContent) => {
    const aggridId = "modelnonlinear";
    header.textContent = "Model Non Linear (Pola Non Moving)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-sm">
            <div>Data Hasil Model Non Linear</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

    columnDefs[aggridId] = [
        { headerName: "Material Code", field: "Material Code", minWidth: 120 },
        { headerName: "Material Description", field: "Material Description", minWidth: 160 },
        { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
        { headerName: "Ongkos Pemakaian Komponen (H)", field: "Ongkos Pemakaian Komponen (H)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Ongkos Kerugian Akibat Kerusakan (L)", field: "Ongkos Kerugian Akibat Kerusakan (L)", minWidth: 290, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Jumlah Komponen Terpasang (m)", field: "Jumlah Komponen Terpasang (m)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Ongkos Model Probabilistik Kerusakan", field: "Ongkos Model Probabilistik Kerusakan", minWidth: 290, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Strategi Penyediaan Optimal (Unit)", field: "Strategi Penyediaan Optimal (Unit)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Harga Resale Komponen (O)", field: "Harga Resale Komponen (O)", minWidth: 190, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
    ];

    datasetAgGrid[aggridId] = dataModel.nonmovingnonlinear;

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};

const toolsBcr = (header, headerAction, childContent) => {
    const aggridId = "modelbcr";
    header.textContent = "Model BCR (Pola BCR)";
    headerAction.innerHTML = "";

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

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between  text-sm">
            <div>Data Hasil Model BCR</div>
            <div class="flex gap-2 justify-between items-center  text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="${aggridId}" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="${aggridId}" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

    columnDefs[aggridId] = [
        { headerName: "Material Code", field: "Material Code", minWidth: 120 },
        { headerName: "Material Description", field: "Material Description", minWidth: 185 },
        { headerName: "ABC Indicator", field: "ABC Indicator", minWidth: 120 },
        { headerName: "Harga Komponen (Ho)", field: "Harga Komponen (Ho)", minWidth: 170, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Kerugian Komponen (Co)", field: "Kerugian Komponen (Co)", minWidth: 195, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Suku Bunga (i)", field: "Suku Bunga (i)", minWidth: 130, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Waktu Sisa Operasi (tahun)", field: "Waktu Sisa Operasi (tahun)", minWidth: 210, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Jenis Probabilitas", field: "Jenis Probabilitas", minWidth: 160 },
        { headerName: "Benefit-Cost Ratio (BCR)", field: "Benefit-Cost Ratio (BCR)", minWidth: 200, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Strategi Penyediaan Optimal (Tahun)", field: "Strategi Penyediaan Optimal (Tahun)", minWidth: 270, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Pesan", field: "Pesan", minWidth: 270 },
    ];

    datasetAgGrid[aggridId] = dataModel.bcr;

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
    agT === "mentah" ? toolsMentah(header, headerAction, childContent) : "";
    agT === "subset" ? toolsSubset(header, headerAction, childContent) : "";
    agT === "class" ? toolsClass(header, headerAction, childContent) : "";
    agT === "q" ? toolsQ(header, headerAction, childContent) : "";
    agT === "wilson" ? toolsWilson(header, headerAction, childContent) : "";
    agT === "poisson" ? toolsPoisson(header, headerAction, childContent) : "";
    agT === "tchebycheff" ? toolsTchebycheff(header, headerAction, childContent) : "";
    agT === "regret" ? toolsRegret(header, headerAction, childContent) : "";
    agT === "linear" ? toolsLinear(header, headerAction, childContent) : "";
    agT === "non-linear" ? toolsNonLinear(header, headerAction, childContent) : "";
    agT === "bcr" ? toolsBcr(header, headerAction, childContent) : "";
};

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
