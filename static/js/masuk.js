const loginAction = () => {
    const spnEmail = document.getElementById("spn-email");
    const inpEmail = document.getElementById("inp-email");
    const spnPass = document.getElementById("spn-password");
    const inpPass = document.getElementById("inp-password");
    const btnLogin = document.getElementById("btn-login");
    const frmLogin = document.getElementById("frm-login");
    notifInp = document.getElementById("notif-input");

    const toClass = ["bottom-8", "text-xs"];
    const fromClass = ["bottom-0", "text-sm"];
    const inpAnimation = [
        [spnEmail, inpEmail],
        [spnPass, inpPass],
    ];

    inpAnimation.forEach((item) => {
        item[1].onfocus = () => {
            item[0].classList.remove(...fromClass);
            item[0].classList.add(...toClass);
        };

        item[1].onblur = (event) => {
            if (event.target.value) {
                return;
            }
            item[0].classList.remove(...toClass);
            item[0].classList.add(...fromClass);
        };
    });

    btnLogin.onclick = async () => {
        if (!inpEmail.value) {
            notifInp.textContent = "Silakan lengkapi form!";
            return;
        }

        let response;
        try {
            response = await fetch("/api/masuk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: inpEmail.value,
                    password: inpPass.value,
                }),
            });
        } catch (e) {
            console.error(e);
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === "success") {
            window.location = "/analisis";
            localStorage.setItem("spiganeca10", data.sid);
        } else {
            notifInp.textContent = "";
            setTimeout(() => (notifInp.textContent = "email / password salah"), 250);
        }
    };

    frmLogin.onkeydown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            btnLogin.click();
        }
    };

    setTimeout(() => inpEmail.focus(), 1000);
};

loginAction();
const setHeight = () => document.getElementById("container").style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
window.addEventListener("resize", setHeight);
