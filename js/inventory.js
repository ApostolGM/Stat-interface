// inventory.js
import { getInventory } from './state.js';

export function renderInventory() {
    const inv = getInventory();
    if (inv.length === 0) {
        document.getElementById('inventoryContent').innerHTML = '<p style="text-align:center;">ИНВЕНТАРЬ ПУСТ</p>';
    } else {
        let html = '<ul style="list-style:none; padding:0;">';
        inv.forEach(item => {
            html += `<li style="padding:5px 0; border-bottom:1px solid #1a3a1a;">${item}</li>`;
        });
        html += '</ul>';
        document.getElementById('inventoryContent').innerHTML = html;
    }
}
