// ui.js
import { setCurrencies, setInventory, getCurrencies, getInventory } from './state.js';
import { log } from './shared.js';

export { setCurrencies, setInventory, getCurrencies, getInventory, log };

let shopCleanup = null;
export function setShopCleanup(fn) { shopCleanup = fn; }

export function showTab(tab, renderFunctions) {
    ['shopContent','lootContent','inventoryContent','groupContent','transferContent'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    switch (tab) {
        case 'shop': document.getElementById('shopContent').classList.remove('hidden'); if(renderFunctions.shop) renderFunctions.shop(); break;
        case 'loot': document.getElementById('lootContent').classList.remove('hidden'); if(renderFunctions.loot) renderFunctions.loot(); break;
        case 'inventory': document.getElementById('inventoryContent').classList.remove('hidden'); if(renderFunctions.inventory) renderFunctions.inventory(); break;
        case 'group': document.getElementById('groupContent').classList.remove('hidden'); if(renderFunctions.group) renderFunctions.group(); break;
        case 'transfer': document.getElementById('transferContent').classList.remove('hidden'); if(renderFunctions.transfer) renderFunctions.transfer(); break;
        case 'admin':
            document.getElementById('adminOverlay').classList.remove('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            import('./admin/admin-main.js').then(m => m.openAdminPanel());
            break;
    }
}

export function resetAdminOnLogout() {
    document.getElementById('adminOverlay').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    if (shopCleanup) shopCleanup();
    shopCleanup = null;
}
