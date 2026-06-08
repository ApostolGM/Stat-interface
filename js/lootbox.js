import { updateUserData } from './db.js';
import { getCurrencies, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToGroups } from './groups-config.js';

export function renderLoot(userId) {
    const char = window.selectedCharacter;
    const container = document.getElementById('lootContent');
    if (!container || !char || !char.groupId) return;

    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === char.groupId);
        if (!group || !group.lootboxes) {
            container.innerHTML = '<p>ЛУТБОКСЫ НЕ НАСТРОЕНЫ</p>';
            return;
        }
        renderLootUI(container, group.lootboxes);
    });
}

function renderLootUI(container, lootboxes) {
    // рендер кнопок лутбоксов
}

async function openLootbox(boxId) {
    // логика открытия с шансами
}