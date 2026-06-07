// ui.js
import { setTokens, setInventory, getTokens, getInventory, log } from './shared.js';
import { resetAdmin, renderAdmin } from './admin.js';

export { setTokens, setInventory, getTokens, getInventory, log };

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
                renderAdmin();
            }
            break;
    }
}

export function resetAdminOnLogout() {
    resetAdmin();
};
