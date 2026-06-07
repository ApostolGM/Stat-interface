// lootbox.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, log } from './ui.js';

const commonLoot = [
    "Банка тушенки (просрочка)", "Фляга с водой", "Бинт стерильный",
    "Батарейки АА", "Пачка галет", "Моток лески",
    "Резиновый пупс", "Ненужная флешка", "Ржавый гвоздь",
    "Довоенная газета"
];
const rareLoot = [
    "Набор отмычек", "Фонарь с динамо-машиной", "Карта местности",
    "Сигнальная ракетница", "Универсальный глушитель", "Доза антирадина",
    "Прочный рюкзак", "Когти крота"
];
const legendaryLoot = [
    "Портативный очиститель воды", "Генератор белого шума", "Силовая батарея МП-8",
    "Имплант 'Зоркий глаз'", "Чертеж экзоскелета", "Ключ-пропуск в Убежище 17"
];

export function renderLoot(userId) {
    document.getElementById('lootContent').innerHTML = `
        <div class="result-box" id="lootResult">
            <span>Выберите капсулу</span>
        </div>
        <div class="loot-options">
            <button class="loot-btn" id="lootCommon">
                <span>📦 ГУМАНИТАРКА</span><span>1 ЖЕТОН</span>
            </button>
            <button class="loot-btn" id="lootRare">
                <span>📦 БАРАХЛО-Х</span><span>2 ЖЕТОНА</span>
            </button>
            <button class="loot-btn" id="lootLegendary">
                <span>📦 СПЕЦИАЛИСТ</span><span>3 ЖЕТОНА</span>
            </button>
        </div>
    `;
    document.getElementById('lootCommon').onclick = () => openLootbox(userId, 1);
    document.getElementById('lootRare').onclick = () => openLootbox(userId, 2);
    document.getElementById('lootLegendary').onclick = () => openLootbox(userId, 3);
}

async function openLootbox(userId, type) {
    let cost, table, boxName;
    if (type === 1) {
        cost = 1; table = commonLoot; boxName = 'ГУМАНИТАРКА';
    } else if (type === 2) {
        cost = 2; table = [...commonLoot, ...rareLoot]; boxName = 'БАРАХЛО-Х';
    } else {
        cost = 3; table = [...rareLoot, ...legendaryLoot]; boxName = 'СПЕЦИАЛИСТ';
    }

    if (getTokens() < cost) {
        log('ОШИБКА: НЕ ХВАТАЕТ ЖЕТОНОВ ДЛЯ ' + boxName + '.');
        return;
    }

    document.getElementById('lootResult').innerHTML = '<span class="blink">АНАЛИЗ КАПСУЛЫ...</span>';
    log('ОТКРЫВАЕТСЯ ' + boxName + '...');

    setTimeout(async () => {
        const roll = Math.floor(Math.random() * 100) + 1;
        let item, rarityText, color = '#20C20E';

        if (type === 1) {
            item = table[Math.floor(Math.random() * table.length)];
            rarityText = '[ОБЫЧНЫЙ]';
        } else if (type === 2) {
            if (roll <= 70) {
                item = commonLoot[Math.floor(Math.random() * commonLoot.length)];
                rarityText = '[ОБЫЧНЫЙ]';
            } else {
                item = rareLoot[Math.floor(Math.random() * rareLoot.length)];
                rarityText = '[РЕДКИЙ]'; color = '#4A90E2';
            }
        } else {
            if (roll <= 60) {
                item = rareLoot[Math.floor(Math.random() * rareLoot.length)];
                rarityText = '[РЕДКИЙ]'; color = '#4A90E2';
            } else {
                item = legendaryLoot[Math.floor(Math.random() * legendaryLoot.length)];
                rarityText = '[ЛЕГЕНДАРНЫЙ]'; color = '#F5A623';
            }
        }

        const newTokens = getTokens() - cost;
        const newInventory = [...getInventory(), item];
        await updateUserData(userId, { tokens: newTokens, inventory: newInventory });

        document.getElementById('lootResult').innerHTML = 
            `<div style="font-size:20px; color:${color};">${item}</div>
             <div style="font-size:14px; opacity:0.8;">${rarityText} | d100: ${roll}</div>`;
        log('ПОЛУЧЕНО: ' + item + ' ' + rarityText);
    }, 1500);
}
