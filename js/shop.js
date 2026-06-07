// shop.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, log } from './ui.js';
import { subscribeToShop } from './shop-config.js';

export function renderShop(userId) {
    const container = document.getElementById('shopContent');
    container.innerHTML = '<p style="text-align:center;">ЗАГРУЗКА ТОВАРОВ...</p>';

    // Подписываемся на изменения магазина
    subscribeToShop((items) => {
        if (items.length === 0) {
            container.innerHTML = '<p style="text-align:center;">МАГАЗИН ПУСТ</p>';
            return;
        }
        let html = '<div class="item-grid">';
        items.forEach(item => {
            html += `
                <div class="item-card" id="buy_${item.id}">
                    ${item.emoji} ${item.name}<br><small>${item.price} жетон${item.price > 1 ? 'а' : ''}</small>
                </div>`;
        });
        html += '</div>';
        html += '<p style="text-align:center; margin-top:15px; opacity:0.7;">[ Жетоны можно найти в Пустоши ]</p>';
        container.innerHTML = html;

        // Навешиваем обработчики
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
