import { updateUserData } from './db.js';
import { getCurrencies, getTotalPink, spendPink, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToGroups } from './groups-config.js';
import { getCharacterById } from './helpers.js';

let currentChar = null;

export function renderShop(userId) {
    currentChar = window.selectedCharacter;
    const container = document.getElementById('shopContent');
    if (!container || container.classList.contains('hidden') || !currentChar || !currentChar.groupId) {
        container.innerHTML = '<p>ВЫ НЕ В ГРУППЕ</p>';
        return;
    }

    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === currentChar.groupId);
        if (!group || !group.shop) {
            container.innerHTML = '<p>МАГАЗИН НЕ НАСТРОЕН</p>';
            return;
        }
        renderShopUI(container, group.shop);
    });
}

function renderShopUI(container, shop) {
    // shop = { categories: { ... } }
    // Здесь рендерим категории и товары, используя данные из group.shop
    // Аналогично старому коду, но без глобальных подписок
    container.innerHTML = '<p>МАГАЗИН ГРУППЫ (обновлённый рендер)</p>';
    // TODO: полный рендер с категориями, подкатегориями, товарами
}

async function buyItem(shopItem) {
    // списание валюты, добавление в инвентарь персонажа
}