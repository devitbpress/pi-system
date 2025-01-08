const inpFile = document.getElementById("inp-file");

let idFile = 1;
let idHasil = 1;
// let option = ``;
let fileList = {};
let dataUnggah = [];
let dataHasil = {};
let modelSet = {
    Q: "model q",
    Wilson: "model wilson",
    Poisson: "model poisson",
    Tchebycheff: "model tchebycheff",
    "Regret (Non Moving)": "model non moving min max regret",
    "Linear (Non Moving)": "model non moving linear",
    "Non Linear (Non Moving)": "model non moving non linear",
    BCR: "model bcr",
    Regret: "model non moving min max regret",
    Linear: "model non moving linear",
    NonLinear: "model non moving non linear",
};

// const downloadTemplate = (agT) => {
//     const dataTemplate = {
//         wilson: ["Material Code", "Material Description", "ABC Indicator", "Permintaan Barang (D) Unit/Tahun", "Harga Barang (p) /Unit", "Ongkos Pesan (A) /Pesan", "Lead Time (L) Tahun", "Ongkos Simpan (h) /Unit/Tahun"],
//         tchebycheff: ["Material Code", "Material Description", "ABC Indicator", "Harga Barang (p) /Unit", "Kerugian Ketidakadaan Barang (Cu) /Unit", "Standar Deviasi Permintaan Barang (s)", "Rata_Rata/Bulan"],
//         q: ["Material Code", "Material Description", "ABC Indicator", "Rata - Rata Permintaan Barang (D) Unit/Tahun", "Lead Time (L) Tahun", "Standar Deviasi Permintaan Barang (s) Unit/Tahun", "Ongkos Pesan (A) /Pesan	Harga Barang (p) /Unit", "Ongkos Simpan (h) /Unit/Tahun", "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"],
//         poisson: ["Material Code", "Material Description", "ABC Indicator", "Rata - Rata Permintaan Barang (D) Unit/Tahun", "Standar Deviasi Permintaan Barang (s) Unit/Tahun", "Lead Time (L) Tahun", "Ongkos Pesan (A) /Pesan", "Harga Barang (p) /Unit	Ongkos Simpan (h) /Unit/Tahun", "Ongkos Kekurangan Inventori (Cu) /Unit/Tahun"],
//         nonmoving: ["Material Code", "Material Description", "ABC Indicator", "Ongkos Pemakaian Komponen (H)", "Ongkos Kerugian Akibat Kerusakan (L)", "Jumlah Komponen Terpasang (m)"],
//         bcr: ["Material Code", "Material Description", "ABC Indicator", "Harga Komponen (Ho)", "Kerugian Komponen (Co)", "Suku Bunga (I)", "Waktu Sisa Operasi (tahun)"],
//     };

//     const data = dataTemplate[agT];
//     const worksheet = XLSX.utils.aoa_to_sheet([data]);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//     XLSX.writeFile(workbook, `template ${agT}.xlsx`);
// };

// const numericInput = (event) => (event.target.value = event.target.value.replace(/[^0-9.]/g, ""));

// const inpSearch = (event) => searchData(event.target.value);

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
    let number = 0;

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
        Q: ["Standar Deviasi Permintaan Barang Waktu Lead Time (SL) Unit/Tahun", "Rata - Rata Permintaan Barang Waktu Lead Time (DL) Unit/Tahun", "Lot Pengadaan Optimum Barang (EOQ) Unit/Pesanan", "Reorder Point (ROP) Unit", "Safety Stock (SS) Unit", "Frequensi Pemesanan (f)", "Ongkos Pembelian (Ob) /Tahun", "Ongkos Pemesanan (Op) /Tahun", "Ongkos Penyimpanan (Os) /Tahun", "Ongkos Kekurangan Inventori (Ok) /Tahun", "Ongkos Inventori (OT) /Tahun"],
        Poisson: ["Economic Order Quantity (EOQ) Lot Optimum (qo1)", "Nilai Alpha", "Ongkos Inventori (OT) /Tahun", "Reorder Point (ROP) Unit", "Safety Stock (SS) Unit", "Service Level (%)", "Standar Deviasi Waktu Ancang - Ancang (SL) Unit/Tahun"],
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
            <div class="h-1 w-full flex items-center justify-center text-gray-300"><span class="h-[1px] min-w-20 w-full bg-gray-300"></span><span>></span></div>
            <div class="py-2 w-fit px-2 border rounded text-right">${typeof response[item] === "number" ? formatNumber(response[item].toFixed(2)) : response[item] !== undefined ? response[item] : "N/A"}</div>
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

    console.log(fileList[agData.id]);
    console.log(agData.id);
    console.log(modelSet[agData.model]);

    const idHasilNow = idHasil;
    const responseCalc = await postFetch("/api/get/calc/manual", { model: "model wilson", items: itemWilson });

    if (responseCalc[0] !== "success") {
        notification("show", "Gagal Kirim Data", "failed");
        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        return "failed";
    }

    if (responseCalc[1].error) {
        notification("show", "Header tidak sesuai dengan template", "failed");
        sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
        return "failed";
    }

    if (modelSet[agData.model] === "nonmoving") {
        const idModel = { "Regret (Non Moving)": "regret", "Linear (Non Moving)": "linear", "Non Linear (Non Moving)": "non_linear" };
        responseCalc[1] = responseCalc[1].map((item) => item[idModel[agData.model]]);
    }

    dataHasil[idHasilNow] = responseCalc[1];
    option += `<option value='${idHasilNow}'>${agData.model} | ${fileList[agData.id].name}</option>`;

    idHasil = idHasil + 1;
    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
    tools("hasil", idHasilNow);
    return "success";
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
            if (pross === "success") {
                dataUnggah.find((item) => item.id === params.data.id).status = `<div class="flex gap-1 items-center cursor-pointer"><img src="./static/assets/done-green.png" alt="delete" class="w-4 h-4" /><span class="text-green-500">Berhasil</span></div>`;
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
        { headerName: "Model", field: "model", editable: true, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["Q", "Wilson", "Poisson", "Tchybeef", "Regret (Non Moving)", "Linear (Non Moving)", "Non Linear (Non Moving)", "BCR"] }, onCellValueChanged: (event) => aggridValueChanged(event), minWidth: 150 },
        { headerName: "AKSI", field: "action", cellRenderer: (params) => aggridCellRenderer(params), minWidth: 100, maxWidth: 100 },
        { headerName: "", field: "proses", cellRenderer: (params) => aggridCellRendererProses(params), minWidth: 100, maxWidth: 100 },
        { headerName: "STATUS", field: "status", futoHeight: true, cellRenderer: (params) => aggridCellRendererStatus(params), minWidth: 150 },
    ];

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);
};
// <div class="w-fit px-4 py-2 cursor-pointer hover:text-blue-700 hover:bg-blue-50 duration-150">satu</div>
const toolsHasil = (header, headerAction, childContent, agD) => {
    const aggridId = "hasil";
    header.textContent = "Hasil Kalkulator Model";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="relative w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-xs">
            <div class="flex gap-2 items-center"></div>
            <div class="flex gap-2 justify-between items-center">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv()" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
        <div class="absolute bottom-1 left-0 px-2 border-t w-full overflow-x-scroll"><div id="sheet-aggrid" class="flex w-fit text-sm"></div></div>
    </div>`;

    console.log(dataHasil);
    // try {
    //     columnDefs[aggridId] = Object.keys(dataHasil[agD][0]).map((key) => {
    //         const lenght = key.length >= 20 ? key.length * 8 : key.length >= 15 ? key.length * 9 : key.length >= 10 ? key.length * 10 : key.length * 12;
    //         return {
    //             headerName: key,
    //             field: key,
    //             minWidth: lenght,
    //             cellRenderer: (params) => {
    //                 return params.value;
    //             },
    //         };
    //     });
    // } catch (error) {
    //     columnDefs[aggridId] = [{ headerName: "Material Code" }, { headerName: "Material Description" }, { headerName: "Material Indikator" }];
    // }

    // const slcHasil = document.getElementById("slc-hasil");
    // if (agD) {
    //     slcHasil.value = agD;
    // }

    // slcHasil.addEventListener("change", () => {
    //     columnDefs["hasil"] = Object.keys(dataHasil[slcHasil.value][0]).map((key) => {
    //         const lenght = key.length >= 20 ? key.length * 8 : key.length >= 15 ? key.length * 9 : key.length >= 10 ? key.length * 10 : key.length * 12;
    //         return {
    //             headerName: key,
    //             field: key,
    //             minWidth: lenght,
    //             cellRenderer: (params) => {
    //                 return params.value;
    //             },
    //         };
    //     });

    //     setupAggrid(dataHasil[slcHasil.value], columnDefs.hasil, false);
    // });

    // try {
    //     const slcHasil = document.getElementById("slc-hasil");

    //     columnDefs["hasil"] = Object.keys(dataHasil[slcHasil.value][0]).map((key) => {
    //         const lenght = key.length >= 20 ? key.length * 8 : key.length >= 15 ? key.length * 9 : key.length >= 10 ? key.length * 10 : key.length * 12;
    //         return {
    //             headerName: key,
    //             field: key,
    //             minWidth: lenght,
    //             cellRenderer: (params) => {
    //                 return params.value;
    //             },
    //         };
    //     });

    //     setupAggrid(dataHasil[slcHasil.value], columnDefs.hasil, false);
    // } catch (error) {
    //     setupAggrid(dataHasil[agD], columnDefs.hasil, false);
    // }
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
                            <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                        </div>

                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                        </div>
                    </div>
                    <div class="flex flex-col w-full">
                        <span>Material Description</span>
                        <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex gap-2">
                        <div class="flex flex-col">
                            <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                            <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                        </div>
                    </div>
                    <div class="flex gap-2">                    
                        <div class="flex flex-col">
                            <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                            <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                        </div>
                        <div class="flex flex-col">
                            <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                            <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Kekurangan Inventori (Cu) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_kekurangan_inventory_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Rata - Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Lead Time (L) Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="lead_time_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
                    </div>
                    <div class="flex flex-col">
                        <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                        <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <div>Rata - Rata Permintaan Barang (D) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="rata_rata_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex flex-col">
                    <div>Standar Deviasi Permintaan Barang (s) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                    <input name="standar_deviasi_permintaan_barang_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-full px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <div>Ongkos Pesan (A) Pesan <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_pesan_per_pesan" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="pesan" />
                    </div>
                    <div class="flex flex-col">
                        <div>Ongkos Simpan (h) Unit/Tahun <span class="text-xs text-red-500">*</span></div>
                        <input name="ongkos_simpan_unit_per_tahun" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit/tahun" />
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <span>Material Description</span>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex flex-col">
                    <div>Harga Barang (p) Unit <span class="text-xs text-red-500">*</span></div>
                    <input name="harga_barang_per_unit" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="unit" />
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
                    <div>Rata - Rata Permintaan Barang (alpha) <span class="text-xs text-red-500">*</span></div>
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <span>ABC Indicator</span>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
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
                            <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                        </div>
                        <div class="flex flex-col">
                            <span>ABC Indicator</span>
                            <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
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
                        <input name="material_code" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                    <div class="flex flex-col">
                        <h1>ABC Indicator</h1>
                        <input name="abc_indikator" type="text" class="py-2 w-52 px-2 border rounded" placeholder="optional" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1>Material Description</h1>
                    <input name="material_description" type="text" class="py-2 w-full px-2 border rounded" placeholder="optional" />
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Harga Komponen (Ho) <span class="text-xs text-red-500">*</span></h1>
                        <input name="harga_komponen" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="harga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Kerugian Komponen (Co) <span class="text-xs text-red-500">*</span></h1>
                        <input name="kerugian_komponen" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="kerugian" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="flex flex-col">
                        <h1>Suku Bunga (I) <span class="text-xs text-red-500">*</span></h1>
                        <input name="suku_bunga" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="suku bunga" />
                    </div>
                    <div class="flex flex-col">
                        <h1>Waktu Sisa Operasi (tahun) <span class="text-xs text-red-500">*</span></h1>
                        <input name="waktu_sisa_operasi" oninput="numericInput(event)" type="text" class="py-2 w-52 px-2 border rounded" inputmode="numeric" pattern="[0-9]*" placeholder="tahun" />
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

    url.searchParams.set("t", agT);
    window.history.replaceState({}, "", url.toString());
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
