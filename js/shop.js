// shop.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, log } from './shared.js';
import { subscribeToShop } from './shop-config.js';

let currentCategory = null;
let unsubscribeShop = null;
let shopCategories = {};
let currentUserId = null;

export function initShop(userId) {
    currentUserId = userId;
    if (unsubscribeShop) unsubscribeShop();

    unsubscribeShop = subscribeToShop((categories) => {
        shopCategories = categories;
        if (!shopCategories[currentCategory]) {
            currentCategory = Object.keys(shopCategories)[0] || null;
        }
        renderShopUI();
    });
}

export function renderShop(userId) {
    if (currentUserId !== userId) {
        initShop(userId);
    }
    renderShopUI();
}

export function cleanupShop() {
    if (unsubscribeShop) {
        unsubscribeShop();
        unsubscribeShop = null;
    }
}

function renderShopUI() {
    const container = document.getElementById('shopContent');
    if (!container || container.classList.contains('hidden')) return;

    const categoryNames = Object.keys(shopCategories);
    if (categoryNames.length === 0) {
        container.innerHTML = '<p style="text-align:center;">МАГАЗИН ПУСТ</p>';
        return;
    }

    if (!currentCategory || !shopCategories[currentCategory]) {
        currentCategory = categoryNames[0];
    }

    let tabsHtml = '<div class="category-tabs">';
    categoryNames.forEach(cat => {
        tabsHtml += `<button class="cat-tab" data-cat="${cat}" style="${cat === currentCategory ? 'background:#20C20E;color:#000;' : ''}">${cat.toUpperCase()}</button>`;
    });
    tabsHtml += '</div>';

    const items = shopCategories[currentCategory] || [];
    let itemsHtml = '<div class="item-grid">';
    if (items.length === 0) {
        itemsHtml += '<p style="text-align:center;width:100%;">В ЭТОЙ КАТЕГОРИИ НЕТ ТОВАРОВ</p>';
    } else {
        items.forEach(item => {
            itemsHtml += `
                <div class="item-card" id="buy_${item.id}">
                    ${item.emoji} ${item.name}<br><small>${item.price} жетон${item.price > 1 ? 'а' : ''}</small>
                </div>`;
        });
    }
    itemsHtml += '</div>';
    itemsHtml += '<p style="text-align:center; margin-top:15px; opacity:0.7;">[ Жетоны можно найти в Пустоши ]</p>';

    container.innerHTML = tabsHtml + itemsHtml;

    document.querySelectorAll('.cat-tab').forEach(btn => {
        btn.onclick = () => {
            currentCategory = btn.dataset.cat;
            renderShopUI();
        };
    });

    items.forEach(item => {
        const btn = document.getElementById(`buy_${item.id}`);
        if (btn) {
            btn.onclick = () => buyItem(item);
        }
    });
}

async function buyItem(item) {
    if (!currentUserId) return;
    if (getTokens() < item.price) {
        log('ОШИБКА: НЕДОСТАТОЧНО ЖЕТОНОВ.');
        return;
    }
    const newTokens = getTokens() - item.price;
    const newInventory = [...getInventory(), `${item.emoji} ${item.name}`];
    await updateUserData(currentUserId, { tokens: newTokens, inventory: newInventory });
    log(`КУПЛЕНО: ${item.name}. -${item.price} ЖЕТОН.`);
}
