// shop.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, log } from './shared.js';
import { subscribeToShop } from './shop-config.js';

let currentCategory = null;
let currentSubcategory = null;
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
            currentSubcategory = null;
        }
        if (currentCategory && currentSubcategory && !shopCategories[currentCategory]?.subcategories?.[currentSubcategory]) {
            currentSubcategory = Object.keys(shopCategories[currentCategory].subcategories)[0] || null;
        }
        renderShopUI();
    });
}

export function renderShop(userId) {
    if (currentUserId !== userId) initShop(userId);
    renderShopUI();
}

export function cleanupShop() {
    if (unsubscribeShop) { unsubscribeShop(); unsubscribeShop = null; }
}

function renderShopUI() {
    const container = document.getElementById('shopContent');
    if (!container || container.classList.contains('hidden')) return;

    const catNames = Object.keys(shopCategories);
    if (catNames.length === 0) {
        container.innerHTML = '<p style="text-align:center;">МАГАЗИН ПУСТ</p>';
        return;
    }

    if (!currentCategory || !shopCategories[currentCategory]) {
        currentCategory = catNames[0];
        currentSubcategory = null;
    }

    // Вкладки категорий
    let html = '<div class="category-tabs">';
    catNames.forEach(cat => {
        html += `<button class="cat-tab" data-cat="${cat}" style="${cat === currentCategory ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">${cat.toUpperCase()}</button>`;
    });
    html += '</div>';

    // Подкатегории
    const subcats = shopCategories[currentCategory]?.subcategories || {};
    const subNames = Object.keys(subcats);
    if (!currentSubcategory || !subcats[currentSubcategory]) {
        currentSubcategory = subNames[0] || null;
    }

    if (subNames.length > 0) {
        html += '<div class="subcategory-tabs" style="display:flex; gap:4px; margin-bottom:10px; flex-wrap:wrap;">';
        subNames.forEach(sub => {
            html += `<button class="subcat-tab" data-sub="${sub}" style="font-size:9px; padding:6px 10px; background:var(--button-bg); color:var(--text-color); border:1px solid var(--border-color); cursor:pointer; ${sub === currentSubcategory ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">${sub}</button>`;
        });
        html += '</div>';
    }

    // Товары
    const items = currentSubcategory ? subcats[currentSubcategory] || [] : [];
    html += '<div class="item-grid">';
    if (items.length === 0) {
        html += '<p style="text-align:center;width:100%;">НЕТ ТОВАРОВ</p>';
    } else {
        items.forEach(item => {
            const imgTag = item.image ? `<img src="${item.image}" style="width:32px;height:32px;display:block;margin:0 auto 5px;">` : '';
            html += `
                <div class="item-card" id="buy_${item.id}">
                    ${imgTag}
                    <div>${item.name}</div>
                    <small>${item.price} РК</small>
                    ${item.tags?.length ? `<div style="font-size:7px;opacity:0.6;margin-top:3px;">${item.tags.join(' · ')}</div>` : ''}
                </div>`;
        });
    }
    html += '</div>';

    container.innerHTML = html;

    // Обработчики
    document.querySelectorAll('.cat-tab').forEach(btn => {
        btn.onclick = () => {
            currentCategory = btn.dataset.cat;
            currentSubcategory = null;
            renderShopUI();
        };
    });
    document.querySelectorAll('.subcat-tab').forEach(btn => {
        btn.onclick = () => {
            currentSubcategory = btn.dataset.sub;
            renderShopUI();
        };
    });
    items.forEach(item => {
        const btn = document.getElementById(`buy_${item.id}`);
        if (btn) btn.onclick = () => buyItem(item);
    });
}

async function buyItem(item) {
    if (!currentUserId) return;
    if (getTokens() < item.price) {
        log('ОШИБКА: НЕДОСТАТОЧНО РК.');
        return;
    }
    const newTokens = getTokens() - item.price;
    const newInventory = [...getInventory(), item.name];
    await updateUserData(currentUserId, { tokens: newTokens, inventory: newInventory });
    log(`КУПЛЕНО: ${item.name}. -${item.price} РК.`);
}
