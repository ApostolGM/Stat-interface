import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { subscribeToGroups } from './groups-config.js';

export async function renderGroup() {
    const container = document.getElementById('groupContent');
    if (!container || container.classList.contains('hidden')) return;
    const char = window.selectedCharacter;
    if (!char || !char.groupId) {
        container.innerHTML = '<p>ВЫ НЕ СОСТОИТЕ В ГРУППЕ</p>';
        return;
    }
    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === char.groupId);
        if (!group) {
            container.innerHTML = '<p>ГРУППА НЕ НАЙДЕНА</p>';
            return;
        }
        let html = `<h3>${group.name}</h3>`;
        // База
        html += '<h4>🏠 БАЗОВЫЙ ИНВЕНТАРЬ</h4>';
        if (!group.baseInventory || group.baseInventory.length === 0) {
            html += '<p>ПУСТО</p>';
        } else {
            group.baseInventory.forEach(item => {
                html += `<div>${item.name} x${item.quantity || 1}</div>`;
            });
        }
        // Бестиарий
        html += '<h4>📖 БЕСТИАРИЙ</h4>';
        if (!group.bestiary || group.bestiary.length === 0) {
            html += '<p>НЕТ ЗАПИСЕЙ</p>';
        } else {
            group.bestiary.forEach(entry => {
                html += `<div style="margin-bottom:8px;"><strong>${entry.name}</strong><br><small>${entry.description || ''}</small></div>`;
            });
        }
        container.innerHTML = html;
    });
}
