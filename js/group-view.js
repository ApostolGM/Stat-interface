// group-view.js
import { subscribeToGroups } from './groups-config.js';

export function renderGroup() {
    const container = document.getElementById('groupContent');
    if (!container || container.classList.contains('hidden')) return;
    const char = window.selectedCharacter;
    if (!char || !char.groupId) {
        container.innerHTML = '<p>ВЫ НЕ В ГРУППЕ</p>';
        return;
    }
    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === char.groupId);
        if (!group) { container.innerHTML = '<p>ГРУППА НЕ НАЙДЕНА</p>'; return; }
        let html = `<h3>${group.name}</h3>`;
        html += '<h4>🏠 БАЗА</h4>';
        if (group.baseInventory?.length) {
            group.baseInventory.forEach(item => html += `<div>${item.name} x${item.quantity || 1}</div>`);
        } else html += '<p>ПУСТО</p>';
        html += '<h4>📖 БЕСТИАРИЙ</h4>';
        if (group.bestiary?.length) {
            group.bestiary.forEach(b => html += `<div><strong>${b.name}</strong><br><small>${b.description || ''}</small></div>`);
        } else html += '<p>НЕТ ЗАПИСЕЙ</p>';
        container.innerHTML = html;
    });
}
