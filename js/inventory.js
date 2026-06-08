// inventory.js
import { getInventory } from './state.js';

export function renderInventory() {
    const container = document.getElementById('inventoryContent');
    if (!container || container.classList.contains('hidden')) return;
    const inv = getInventory();
    if (!inv || inv.length === 0) {
        container.innerHTML = '<p style="text-align:center;">ИНВЕНТАРЬ ПУСТ</p>';
        return;
    }
    let html = '<div style="display:flex; flex-direction:column; gap:4px;">';
    inv.forEach(item => {
        const qty = item.quantity ? ` ×${item.quantity}` : '';
        const dur = item.durability !== undefined ? ` [${item.durability}%]` : '';
        const img = item.image ? `<img src="${item.image}" style="width:20px;height:20px;vertical-align:middle;"> ` : '';
        html += `<div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid var(--card-hover-bg);">
            <span>${img}${item.name}${qty}${dur}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}
