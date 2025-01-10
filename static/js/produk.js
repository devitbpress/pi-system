let datasetProduct = [];

const setProduct = async () => {
    const idProgress = progresBar("Ambil Data Produk", "Data Produk", 50000);
    let currentFrom = 0;
    const batchSize = 1000;
    const delay = 1000;

    async function fetchProducts() {
        try {
            while (true) {
                const response = await postFetch("/api/get/product", { item: { limit: currentFrom, size: batchSize } });

                if (response.status !== "success") {
                    sInterval[idProgress] === "done" ? progresBarStatus(idProgress) : (sInterval[idProgress] = "done");
                    break;
                }

                gridApi["product"].applyTransaction({ add: response.data });

                currentFrom += batchSize;

                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }

    fetchProducts();
};

const toolsProducts = (header, headerAction, childContent) => {
    const aggridId = "product";
    header.textContent = "List Produk";
    headerAction.innerHTML = "";

    childContent.innerHTML = `<div class="w-full h-full bg-white rounded-xl shadow p-3 flex flex-col gap-3">
        <div class="w-full flex justify-between text-xs">
            <div>Produk PI</div>
            <div class="flex gap-2 justify-between items-center text-xs">
                <span>Cari Data</span>
                <input oninput="inpSearch(event)" data="product" id="inpSearch" type="text" placeholder="cari..." class="outline-none border py-1 px-2 rounded border-green-500" />
                <button onclick="downloadCsv(event)" data="product" id="btnCsv" class="ml-4 bg-transparent hover:bg-green-500 text-green-700 hover:text-white py-1 px-2 border border-green-500 hover:border-transparent rounded">Export CSV</button>
            </div>
        </div>
        <div id="aggrid-${aggridId}" class="ag-theme-quartz w-full h-full"></div>
    </div>`;

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

    columnDefs[aggridId] = [
        { headerName: "id", field: "p_id", hide: true },
        { headerName: "No", valueGetter: "node.rowIndex + 1", minWidth: 60, maxWidth: 60, pinned: "left", cellClass: "justify-end" },
        { headerName: "Material Code", field: "p_code", minWidth: 150, editable: true },
        { headerName: "Material Description", field: "p_description", minWidth: 200, editable: true },
        { headerName: "ABC Indikator", field: "p_abc", minWidth: 150, editable: true },
        { headerName: "Unit Price", field: "p_price", minWidth: 150, editable: true, headerClass: "justify-center", cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Estimasi Lead Time (mon)", field: "p_lead_m", minWidth: 250, editable: true, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
        { headerName: "Estimasi Lead Time (day)", field: "p_lead_d", minWidth: 250, editable: true, cellClass: "justify-end", valueFormatter: (params) => returnFloat(params), comparator: (valueA, valueB) => comparatorGrid(valueA, valueB) },
    ];

    gridAddOptions[aggridId] = {
        onCellValueChanged: async (event) => {
            try {
                const response = await postFetch("/api/put/product", { value: event.newValue, field: event.colDef.field, p_id: event.data.p_id });
                if (response.status !== "success") {
                    notification("show", "Update data failed", "failed");
                    return;
                }

                notification("show", "Update success", "success");
            } catch (e) {
                notification("show", "Update data failed", "failed");
                console.error(e);
            }
        },
    };

    setupAggrid(`aggrid-${aggridId}`, datasetAgGrid[aggridId], columnDefs[aggridId], aggridId);

    setProduct();
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

    agT === "products" ? toolsProducts(header, headerAction, childContent) : "";
};

document.addEventListener("DOMContentLoaded", async () => {
    setHeight();

    const ParamTools = urlParams.get("t");
    if (ParamTools) {
        tools(ParamTools);
    } else {
        url.searchParams.set("t", "products");
        window.history.replaceState({}, "", url.toString());
        tools("products");
    }

    setTimeout(() => miniNav(), 150);
});
