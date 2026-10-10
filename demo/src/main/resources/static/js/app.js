document.addEventListener("DOMContentLoaded", () => {
    const timerEl = document.querySelector("[data-duration-minutes]");
    if (!timerEl) {
        return;
    }
    const minutes = Number(timerEl.getAttribute("data-duration-minutes") || "0");
    if (!minutes || minutes <= 0) {
        return;
    }
    let remaining = minutes * 60;
    const tick = () => {
        const m = Math.floor(remaining / 60).toString().padStart(2, "0");
        const s = Math.floor(remaining % 60).toString().padStart(2, "0");
        timerEl.textContent = `${m}:${s}`;
        if (remaining <= 0) {
            const form = document.querySelector("form[data-auto-submit]");
            if (form) {
                form.submit();
            }
            return;
        }
        remaining -= 1;
        window.setTimeout(tick, 1000);
    };
    tick();
});
