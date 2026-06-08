// lootbox.js
import { updateUserData } from './db.js';
import { getCurrencies, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToGroups } from './groups-config.js';
import { subscribeToItems } from './items-config.js';

let allItems = [];

export function renderLoot(userId) {
    const char = window.selectedCharacter;
    const container = document.getElementById('lootContent');
    if (!container || container.classList.contains('hidden') || !char || !char.groupId) return;

    subscribeToItems(items => { allItems = items; });
    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === char.groupId);
        if (!group || !group.lootboxes) {
            container.innerHTML = '<p>ЛУТБОКСЫ НЕ НАСТРОЕНЫ</p>';
            return;
        }
        renderLootUI(container, group.lootboxes, char);
    });
}

function renderLootUI(container, lootboxes, char) {
    let html = '<div class="loot-options">';
    lootboxes.forEach(box => {
        html += `<button class="loot-btn" data-id="${box.id}">${box.name} — ${box.price} РК</button>`;
    });
    html += '</div><div class="result-box" id="lootResult"><span>ВЫБЕРИТЕ ЛУТБОКС</span></div>';
    container.innerHTML = html;

    document.querySelectorAll('.loot-btn').forEach(btn => {
        btn.onclick = () => openLootbox(btn.dataset.id, lootboxes, char);
    });
}

async function openLootbox(boxId, lootboxes, char) {
    const box = lootboxes.find(b => b.id === boxId);
    if (!box) return;
    const currencies = getCurrencies();
    const total = (currencies.pink||0) + (currencies.gray||0)*10 + (currencies.yellow||0)*100;
    if (total < box.price) { log('НЕДОСТАТОЧНО КРИСТАЛЛОВ'); return; }

    document.getElementById('lootResult').innerHTML = '<span class="blink">ОТКРЫТИЕ...</span>';
    setTimeout(async () => {
        // Выбор предмета по шансам
        const totalChance = box.items.reduce((s, i) => s + i.chance, 0);
        let roll = Math.random() * totalChance;
        let chosenItem = box.items[0];
        for (const item of box.items) {
            roll -= item.chance;
            if (roll <= 0) { chosenItem = item; break; }
        }
        const itemData = allItems.find(i => i.id === chosenItem.itemId);
        if (!itemData) return;

        // Списание валюты
        const newCurrencies = { ...currencies };
        let remaining = box.price;
        // упрощённое списание
        if (newCurrencies.yellow) { const s = Math.min(newCurrencies.yellow, Math.floor(remaining/100)); newCurrencies.yellow -= s; remaining -= s*100; }
        if (newCurrencies.gray) { const s = Math.min(newCurrencies.gray, Math.floor(remaining/10)); newCurrencies.gray -= s; remaining -= s*10; }
        newCurrencies.pink -= remaining;

        const inventory = getInventory();
        const exist = inventory.find(i => i.itemId === chosenItem.itemId && !i.durability);
        if (exist) exist.quantity = (exist.quantity||1)+1;
        else inventory.push({ itemId: chosenItem.itemId, name: itemData.name, image: itemData.image, quantity: 1 });

        await updateUserData(char.userId, { currencies: newCurrencies, inventory: [...inventory] });
        document.getElementById('lootResult').innerHTML = `ПОЛУЧЕНО: ${itemData.name}`;
        log(`ИЗ ${box.name} ПОЛУЧЕНО: ${itemData.name}`);
    }, 1500);
}