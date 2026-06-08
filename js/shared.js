// shared.js — только функция логирования
export function log(text) {
    const logEl = document.getElementById('logMessage');
    if (logEl) {
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
        }, 25);
    }
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 500;
        gain.gain.value = 0.02;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.04);
        osc.stop(ctx.currentTime + 0.04);
    } catch(e) {}
}