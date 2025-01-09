// post data
const postFetch = async (agU, agD) => {
    try {
        const response = await fetch(agU, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(agD) });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        return ["error", error];
    }
};

// post file
const postFiles = async (agUrl, agFile, agId, item) => {
    const formData = new FormData();
    formData.append("file", agFile);
    formData.append("file_id", agId);
    formData.append("item", item);

    try {
        const response = await fetch(agUrl, { method: "POST", body: formData });
        const data = await response.json();

        return data;
    } catch (error) {
        return ["error", error.message || error];
    }
};

// ~~Navigation~~
const url = new URL(window.location.href);
const urlParams = new URLSearchParams(window.location.search);
const btnChevron = document.getElementById("btn-chevron");
const childTools = document.getElementById("child-tools");

let miniNavIndikacator = { status: false, nav: "13rem", tools: "13rem" };

// mini nav
const miniNav = () => {
    const boxNav = document.getElementById("box-nav");
    const boxContent = document.getElementById("box-content");
    const imgTitle = document.getElementById("img-title");
    const childNav = document.getElementById("child-nav");
    const boxAccount = document.getElementById("box-account");

    if (miniNavIndikacator.status) {
        boxNav.style.width = "11rem";
        miniNavIndikacator.nav = "11rem";
        miniNavIndikacator.status = false;
        btnChevron.querySelector("img").classList.remove("rotate-180");
        imgTitle.style.width = "80%";
        imgTitle.classList.add("ml-3");
        childNav.querySelectorAll("span").forEach((element) => (element.style.display = "block"));
        boxAccount.querySelectorAll("span").forEach((element) => (element.style.display = "block"));
        imgTitle.src = "./static/assets/pupuk-indonesia-white.png";
    } else {
        boxNav.style.width = "4rem";
        miniNavIndikacator.nav = "4rem";
        miniNavIndikacator.status = true;
        btnChevron.querySelector("img").classList.add("rotate-180");
        childNav.querySelectorAll("span").forEach((element) => (element.style.display = "none"));
        boxAccount.querySelectorAll("span").forEach((element) => (element.style.display = "none"));
        imgTitle.src = "./static/assets/favicon.png";
        imgTitle.style.width = "100%";
        imgTitle.classList.remove("ml-3");
    }

    boxContent.style.width = `calc(100vw - ${miniNavIndikacator.nav}  - ${miniNavIndikacator.tools})`;
};

// style tools
const styleTools = (agT, agCC) => {
    childTools.querySelectorAll(`.tools`).forEach((element) => {
        element.classList.remove("bg-sky-500");
        element.classList.add("hover:bg-sky-300");
        element.classList.remove("text-white");
        element.classList.add("hover:text-white");
    });

    const toolsSelected = childTools.querySelector(`.${agT}`);
    if (!toolsSelected) {
        return;
    }
    toolsSelected.classList.remove("hover:bg-sky-300");
    toolsSelected.classList.add("bg-sky-500");
    toolsSelected.classList.remove("hover:text-white");
    toolsSelected.classList.add("text-white");

    agCC.innerHTML = "";
};

// set height
const setHeight = () => document.getElementById("container").style.setProperty("--vh", `${window.innerHeight * 0.01}px`);

// set up element
childTools ? childTools.querySelectorAll(".tools").forEach((element) => element.addEventListener("click", () => tools(element.getAttribute("data-tools")))) : void 0;
btnChevron ? btnChevron.addEventListener("click", () => miniNav()) : void 0;
window.addEventListener("resize", setHeight);
// ~~Navigation~~

const indikatorNavigation = (agN, agI) => {
    const element = document.querySelector(`.int-${agN}`);
    color = { P: "#3b82f6", D: "#22c55e", U: "#eab308" };

    element.textContent = agI;
    element.style.color = color[agI];
    element.style.textShadow = `
        -1px -1px 0 white,  
        1px -1px 0 white,
        -1px 1px 0 white,
        1px 1px 0 white
    `;
};

// ~~Ag Grid~~
let gridApi = {};
let columnDefs = {};
let gridAddOptions = {};
let datasetAgGrid = {};

// aggrid
const setupAggrid = async (agId, agData, agCol, agName, agView) => {
    const eGrid = document.getElementById(agId);
    const cGrid = document.querySelectorAll(".ag-header-cell-label");
    const standarOption = { columnDefs: agCol, rowData: agData, defaultColDef: { flex: 1 }, rowHeight: 35 };
    const gridOptions = { ...standarOption, ...gridAddOptions[agName] };

    eGrid.innerHTML = "";

    // Add a slight delay before calling `createGrid`
    setTimeout(() => {
        gridApi[agName] = agGrid.createGrid(eGrid, gridOptions);

        // Additional UI adjustments after rendering
        document.querySelector(".ag-paging-panel").classList.add("text-xs");
        document.querySelector(".ag-paging-panel").style.height = "35px";
        setLoading(agView, agName);

        cGrid.forEach((element) => {
            if (element.textContent.trim() === "Total") {
                element.classList.add("justify-end", "pr-5");
            }
        });
    }, 0); // Delay to ensure grid is fully rendered
};

// addon aggrid
const setLoading = (value, name) => gridApi[name].setGridOption("loading", value);
const downloadCsv = (event) => gridApi[event.target.getAttribute("data")].exportDataAsCsv();
const searchData = (agV, name) => gridApi[name].setGridOption("quickFilterText", agV);
const inpSearch = (event) => searchData(event.target.value, event.target.getAttribute("data"));
// ~~Ag Grid~~

// ~~Notification~~
let idProgress = 1;
let sInterval = {};
let idNotif = 1;

// progress
const progress = (agH, agS) => {
    const elementProgress = document.getElementById("progress");
    const idProgressNow = idProgress;

    elementProgress.innerHTML += `<div id="box-${idProgressNow}" class="w-full flex flex-col bg-white shadow border px-2 py-1 rounded gap-1 origin-right duration-300">
            <h1 class="py-1 text-sm font-medium">${agH}</h1>
            <span id="span-subtitle-${idProgressNow}">${agS}</span>
            <div class="w-[15rem] flex gap-2 items-center">
                <div class="w-full h-3 relative">
                    <div class="w-full h-full rounded bg-blue-700"></div>
                    <div id="width-${idProgressNow}" class="w-1 h-full rounded bg-green-600 absolute top-0 left-0"></div>
                </div>
                <div id="bar-${idProgressNow}" class="whitespace-nowrap">0%</div>
            </div>
        </div>`;

    idProgress += 1;

    return { width: `width-${idProgressNow}`, bar: `bar-${idProgressNow}`, box: `box-${idProgressNow}`, span: `span-subtitle-${idProgressNow}` };
};

// progres bar
const progresBarStatus = (agId) => {
    try {
        document.getElementById(`width-${agId}`).style.width = `100%`;
        document.getElementById(`bar-${agId}`).textContent = `100%`;
    } catch (error) {
        console.error("Error setting progress bar width or text:", error);
    }

    setTimeout(() => {
        try {
            document.getElementById(`box-${agId}`).classList.add("scale-0");
            setTimeout(() => document.getElementById(`box-${agId}`).remove(), 150);
        } catch (error) {
            console.error("Error removing progress bar element:", error);
        }
    }, 250);
};

// fungsi pertama progres bar
const progresBar = (agTM, agBM, agT) => {
    const elementProgress = document.getElementById("progress");
    const idProgressNow = idProgress;

    const content = `<div id="box-${idProgressNow}" class="w-full flex flex-col bg-white shadow border px-2 py-1 rounded gap-1 origin-right duration-300"><h1 class="py-1 text-sm font-medium">${agTM}</h1><span id="span-subtitle-${idProgressNow}">${agBM}</span><div class="w-[15rem] flex gap-2 items-center"><div class="w-full h-3 relative"><div class="w-full h-full rounded bg-blue-700"></div><div id="width-${idProgressNow}" class="w-1 h-full rounded bg-green-600 absolute top-0 left-0"></div></div><div id="bar-${idProgressNow}" class="whitespace-nowrap">0%</div></div></div>`;
    elementProgress.innerHTML += content;

    let number = 0;
    sInterval[idProgressNow] = "run";
    idProgress += 1;

    const interval = setInterval(() => {
        try {
            document.getElementById(`width-${idProgressNow}`).style.width = `${number}%`;
            document.getElementById(`bar-${idProgressNow}`).textContent = `${number}%`;
        } catch (error) {
            clearInterval(interval);
        }

        number += 1;

        sInterval[idProgressNow] === "done" ? (clearInterval(interval), progresBarStatus(idProgressNow)) : void 0;

        if (number > 95) {
            clearInterval(interval);
            sInterval[idProgressNow] = "done";
        }
    }, agT / 100);

    return idProgressNow;
};

// notifikasi
const notification = (agS, agE, agSt) => {
    const notif = document.getElementById("notification");
    const notifNow = idNotif;
    const status = { success: "done-green.png", failed: "error-red.png" };

    if (agS === "show") {
        notif.innerHTML += `
            <div id="notif-${notifNow}" class="px-2 py-1 flex items-center gap-2 bg-white w-fit border rounded scale-0 origin-right duration-300">
                <img src="./static/assets/${status[agSt]}" alt="${agSt}" class="h-5 w-5 cursor-pointer" />
                ${agE}
            </div>
        `;

        idNotif += 1;
        setTimeout(() => {
            document.getElementById(`notif-${notifNow}`).classList.remove("scale-0");
        }, 150);
    } else {
        const elementDelete = document.getElementById(`${agE}`);
        elementDelete.classList.add("scale-0");
        setTimeout(() => elementDelete.remove(), 150);
    }

    setTimeout(() => {
        try {
            notification("hide", `notif-${notifNow}`);
        } catch (error) {
            void 0;
        }
    }, 5000);
};
// ~~Notification~~

// ~~Fitur~~
// to Title Case
const toTitleCase = (str) =>
    typeof str === "string"
        ? str
              .split(" ")
              .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
              .join(" ")
        : str;

// popup
const popupContent = (agShow, agElm, agBlur) => {
    const element = document.getElementById("popup-content");
    if (agShow !== "show") {
        element.style.width = "0";
        element.style.height = "0";

        element.innerHTML = "";
        return;
    }

    let content = ``;

    element.style.width = "100%";
    element.style.height = "100%";

    content = `<div onclick="popupContent()" class="w-full h-full absolute top-0 left-0 ${agBlur === "blur" ? "backdrop-blur" : void 0}"></div><div id="content-show-poppup" class="absolute bottom-1/2 right-1/2 w-fit h-fit scale-0 translate-x-1/2 translate-y-1/2 duration-150">${agElm}</div>`;

    element.innerHTML = content;

    const elementShow = document.getElementById("content-show-poppup");

    setTimeout(() => elementShow.classList.remove("scale-0"), 150);
};

// popup
const loadingScreen = (agShow) => {
    const element = document.getElementById("loading-screen");
    if (agShow !== "show") {
        element.style.width = "0";
        element.style.height = "0";

        element.innerHTML = "";
        return;
    }

    let content = ``;

    element.style.width = "100%";
    element.style.height = "100%";

    content = `
        <div class="w-full h-full absolute top-0 left-0 backdrop-blur">
        <div class="w-full h-full absolute top-0 left-0 bg-black opacity-50">
            </div><div id="content-show-poppup" class="absolute bottom-1/2 right-1/2 w-fit h-fit scale-0 translate-x-1/2 translate-y-1/2 duration-150">
            <div class="loadingio-spinner-bean-eater-nq4q5u6dq7r">
                <div class="ldio-x2uulkbinc">
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            </div>
        </div>`;

    element.innerHTML = content;

    const elementShow = document.getElementById("content-show-poppup");

    setTimeout(() => elementShow.classList.remove("scale-0"), 150);
};

// resizeable
const resizeableContent = (agCont, agHand) => {
    const resizeableDiv = document.getElementById(agCont);
    const resizeHandle = document.getElementById(agHand);

    let isResizing = false;

    resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        const startY = e.clientY;
        const startHeight = resizeableDiv.offsetHeight;

        const onMouseMove = (e) => {
            if (isResizing) {
                const diffY = e.clientY - startY;
                resizeableDiv.style.height = `${startHeight + diffY}px`;
            }
        };

        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
};
// ~~Fitur~~
