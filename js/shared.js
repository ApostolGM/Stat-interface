// shared.js
let tokens = 0;
let inventory = [];

export function setTokens(val) {
    tokens = val;
    const display = document.getElementById('tokenDisplay');
    if (display) display.innerText = tokens + ' ЖЕТОН' + (tokens == 1 ? '' : 'А');
}

export function setInventory(val) {
    inventory = val;
}

export function getTokens() {
    return tokens;
}

export function getInventory() {
    return inventory;
}

export function log(text) {
    const logEl = document.getElementById('logMessage');
    if (logEl) {
        // Эффект печатающегося текста
        logEl.innerHTML = '> ';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                logEl.innerHTML = '> ' + text.substring(0, i + 1) + '<span class="blink">_</span>';
                i++;
            } else {
                logEl.innerHTML = '> ' + text;
                clearInterval(interval);
            }
        }, 30);
    }
    // Звук лога
    playBeep(400, 0.05);
}

// Простой звуковой сигнал
function playBeep(freq, duration) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.03;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
    } catch(e) {}
}
