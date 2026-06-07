// shared.js – общие данные и утилиты

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
    if (logEl) logEl.innerHTML = '> ' + text;
}
