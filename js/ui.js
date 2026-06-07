// ui.js
import { resetAdmin, renderAdmin } from './admin.js';

let tokens = 0;
let inventory = [];

export function setTokens(val) {
    tokens = val;
    document.getElementById('tokenDisplay').innerText = tokens + ' ЖЕТОН' + (tokens == 1 ? '' : 'А');
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
    document.getElementById('logMessage').innerHTML = '> ' + text;
}

export function showTab(tab, renderFunctions) {
    document.getElementById('shopContent').classList.add('hidden');
    document.getElementById('lootContent').classList.add('hidden');
    document.getElementById('inventoryContent').classList.add('hidden');
    const adminContent = document.getElementById('adminContent');
    if (adminContent) adminContent.classList.add('hidden');

    switch (tab) {
        case 'shop':
            document.getElementById('shopContent').classList.remove('hidden');
            if (renderFunctions.shop) renderFunctions.shop();
            break;
        case 'loot':
            document.getElementById('lootContent').classList.remove('hidden');
            if (renderFunctions.loot) renderFunctions.loot();
            break;
        case 'inventory':
            document.getElementById('inventoryContent').classList.remove('hidden');
            if (renderFunctions.inventory) renderFunctions.inventory();
            break;
        case 'admin':
            if (adminContent) {
                adminContent.classList.remove('hidden');
                renderAdmin(); // вызов админского рендера
            }
            break;
    }
}

export function resetAdminOnLogout() {
    resetAdmin();
}
