// shop.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, log } from './shared.js';
import { subscribeToShop } from './shop-config.js';

let currentCategory = null;

export function renderShop(userId) {
    const container = document.getElementById('shopContent');
    container.innerHTML = '<p style="text-align:center;">ЗАГРУЗКА ТОВАРОВ...</p>';

    subscribeToShop((categories) => {
        const categoryNames = Object.keys(categories);
        if (categoryNames.length === 0) {
            container.innerHTML = '<p style="text-align:center;">МАГАЗИН ПУСТ</p>';
            return;
        }

        // Если текущая категория не существует, выбираем первую
        if (!currentCategory || !categories[currentCategory]) {
            currentCategory = categoryNames[0];
        }

        // Вкладки категорий
        let tabsHtml = '<div class="category-tabs" style="display:flex; gap:5px; margin-bottom:10px; flex-wrap:wrap;">';
        categoryNames.forEach(cat => {
            tabsHtml += `<button class="cat-tab" data-cat="${cat}" style="${cat === currentCategory ? 'background:#20C20E;color:#000;' : ''}">${cat.toUpperCase()}</button>`;
        });
        tabsHtml += '</div>';

        // Товары текущей категории
        const items = categories[currentCategory] || [];
        let itemsHtml = '<div class="item-grid">';
        items.forEach(item => {
            itemsHtml += `
                <div class="item-card" id="buy_${item.id}">
                    ${item.emoji} ${item.name}<br><small>${item.price} жетон${item.price > 1 ? 'а' : ''}</small>
                </div>`;
        });
        itemsHtml += '</div>';
        itemsHtml += '<p style="text-align:center; margin-top:15px; opacity:0.7;">[ Жетоны можно найти в Пустоши ]</p>';

        container.innerHTML = tabsHtml + itemsHtml;

        // Обработчики вкладок
        document.querySelectorAll('.cat-tab').forEach(btn => {
            btn.onclick = () => {
                currentCategory = btn.dataset.cat;
                renderShop(userId);
            };
        });

        // Обработчики покупок
        items.forEach(item => {
            document.getElementById(`buy_${item.id}`).onclick = () => buyItem(userId, item);
        });
    });
}

async function buyItem(userId, item) {
    if (getTokens() < item.price) {
        log('ОШИБКА: НЕДОСТАТОЧНО ЖЕТОНОВ.');
        return;
    }
    const newTokens = getTokens() - item.price;
    const newInventory = [...getInventory(), `${item.emoji} ${item.name}`];
    await updateUserData(userId, { tokens: newTokens, inventory: newInventory });
    log(`КУПЛЕНО: ${item.name}. -${item.price} ЖЕТОН.`);
}
