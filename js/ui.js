// ui.js
import { setTokens, setInventory, getTokens, getInventory, log } from './shared.js';
import { resetAdmin, renderAdmin } from './admin.js';

export { setTokens, setInventory, getTokens, getInventory, log };

let shopCleanup = null;
export function setShopCleanup(fn) { shopCleanup = fn; }

export function showTab(tab, renderFunctions) {
    document.getElementById('shopContent').classList.add('hidden');
    document.getElementById('lootContent').classList.add('hidden');
    document.getElementById('inventoryContent').classList.add('hidden');
    document.getElementById('groupContent').classList.add('hidden');
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
        case 'group':
            document.getElementById('groupContent').classList.remove('hidden');
            if (renderFunctions.group) renderFunctions.group();
            break;
        case 'admin':
            if (adminContent) {
                adminContent.classList.remove('hidden');
                renderAdmin();
            }
            break;
    }
}

export function resetAdminOnLogout() {
    resetAdmin();
    if (shopCleanup) { shopCleanup(); shopCleanup = null; }
}
