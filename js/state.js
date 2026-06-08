let currencies = { pink: 0, gray: 0, yellow: 0 };
let inventory = [];

export function setCurrencies(val) {
    currencies = val || { pink: 0, gray: 0, yellow: 0 };
    updateDisplay();
}
export function getCurrencies() { return currencies; }
export function setInventory(val) { inventory = val || []; }
export function getInventory() { return inventory; }

export function getTotalPink() {
    return (currencies.pink || 0) + (currencies.gray || 0) * 10 + (currencies.yellow || 0) * 100;
}

export function spendPink(amount) {
    let total = getTotalPink();
    if (total < amount) return false;
    let remaining = amount;
    const newCurrencies = { ...currencies };
    const yellowSpent = Math.min(Math.floor(remaining / 100), newCurrencies.yellow || 0);
    remaining -= yellowSpent * 100;
    newCurrencies.yellow -= yellowSpent;
    const graySpent = Math.min(Math.floor(remaining / 10), newCurrencies.gray || 0);
    remaining -= graySpent * 10;
    newCurrencies.gray -= graySpent;
    if (remaining > (newCurrencies.pink || 0) && newCurrencies.gray > 0) {
        newCurrencies.gray -= 1;
        newCurrencies.pink += 10;
    }
    newCurrencies.pink -= remaining;
    currencies = newCurrencies;
    updateDisplay();
    return true;
}

export function addCurrency(type, amount) {
    currencies[type] = (currencies[type] || 0) + amount;
    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('tokenDisplay');
    if (!display) return;
    const parts = [];
    if (currencies.yellow) parts.push(`${currencies.yellow} Ж`);
    if (currencies.gray) parts.push(`${currencies.gray} С`);
    if (currencies.pink || parts.length === 0) parts.push(`${currencies.pink} Р`);
    display.innerText = parts.join(' · ') + 'К';
}