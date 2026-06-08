// lootbox.js
import { updateUserData } from './db.js';
import { getCurrencies, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToLootboxes } from './lootbox-config.js';

let lootboxes = [];
let unsubscribeLoot = null;

export function renderLoot(userId) {
    const container = document.getElementById('lootContent');
    if (!container || container.classList.contains('hidden')) return;

    if (unsubscribeLoot) unsubscribeLoot();

    container.innerHTML = '<p style="text-align:center;">ЗАГРУЗКА ЛУТБОКСОВ...</p>';

    unsubscribeLoot = subscribeToLootboxes((boxes) => {
        lootboxes = boxes;
        renderLootUI(container, userId);
    });
}

function renderLootUI(container, userId) {
    if (lootboxes.length === 0) {
        container.innerHTML = '<p style="text-align:center;">НЕТ ДОСТУПНЫХ ЛУТБОКСОВ</p>';
        return;
    }

    let html = '<div class="loot-options">';
    lootboxes.forEach(box => {
        const imgTag = box.image ? `<img src="${box.image}" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;">` : '';
        html += `
            <button class="loot-btn" data-id="${box.id}">
                <span>${imgTag}${box.name}</span>
                <span>${box.price} РК</span>
            </button>`;
    });
    html += '</div>';
    html += '<div class="result-box" id="lootResult"><span>ВЫБЕРИТЕ ЛУТБОКС</span></div>';
    container.innerHTML = html;

    document.querySelectorAll('.loot-btn').forEach(btn => {
        btn.onclick = () => openLootbox(btn.dataset.id, userId);
    });
}

async function openLootbox(boxId, userId) {
    const box = lootboxes.find(b => b.id === boxId);
    if (!box) return;

    if (getTokens() < box.price) {
        log('ОШИБКА: НЕДОСТАТОЧНО РК.');
        document.getElementById('lootResult').innerHTML = '<span style="color:#FF4444;">НЕДОСТАТОЧНО РК</span>';
        return;
    }

    // Списываем РК
    const newTokens = getTokens() - box.price;

    // Анимация кручения
    document.getElementById('lootResult').innerHTML = '<span class="blink">ОТКРЫТИЕ КАПСУЛЫ...</span>';
    log(`ОТКРЫВАЕТСЯ ${box.name}...`);

    // Задержка для эффекта
    setTimeout(async () => {
        // Выбираем предмет на основе шансов
        const item = rollItem(box.items);
        
        const newInventory = [...getInventory(), item.name];
        await updateUserData(userId, { tokens: newTokens, inventory: newInventory });

        const imgTag = item.image ? `<img src="${item.image}" style="width:48px;height:48px;display:block;margin:0 auto 10px;">` : '';
        document.getElementById('lootResult').innerHTML = `
            ${imgTag}
            <div style="font-size:18px;color:var(--text-color);">${item.name}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:5px;">ПОЛУЧЕНО!</div>`;
        log(`ИЗ ${box.name} ПОЛУЧЕНО: ${item.name}. -${box.price} РК.`);
    }, 1500);
}

// Выбор случайного предмета с учётом шансов
function rollItem(items) {
    const totalChance = items.reduce((sum, item) => sum + item.chance, 0);
    let roll = Math.random() * totalChance;
    for (const item of items) {
        roll -= item.chance;
        if (roll <= 0) return item;
    }
    return items[items.length - 1]; // fallback
}

export function cleanupLoot() {
    if (unsubscribeLoot) {
        unsubscribeLoot();
        unsubscribeLoot = null;
    }
}
