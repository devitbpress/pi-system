const sessionId = localStorage.getItem("spiganeca10");
let sId = ``;
!sessionId ? (window.location = "/masuk") : (sId = sessionId);

let now = new Date();
console.log(now.getTime());
sessionStorage.setItem("session", now.getTime());
const session = sessionStorage.getItem("session");

window.onbeforeunload = (event) => {
    postFetch("/api/delete/session", { session: session });
    event.preventDefault();
    event.returnValue = "";
};
