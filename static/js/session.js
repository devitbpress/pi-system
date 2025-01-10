const sessionId = localStorage.getItem("spiganeca10");
let sId = ``;
!sessionId ? (window.location = "/masuk") : (sId = sessionId);

let session = sessionStorage.getItem("session");
if (!session) {
    let now = new Date();
    sessionStorage.setItem("session", now.getTime());
    session = sessionStorage.getItem("session");
}

window.onbeforeunload = (event) => {
    postFetch("/api/delete/session", { session: session });
    event.preventDefault();
    event.returnValue = "";
};
