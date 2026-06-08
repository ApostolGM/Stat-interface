// shop.js
import { updateUserData } from './db.js';
import { getCurrencies, getTotalPink, spendPink, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToGroups } from './groups-config.js';
import { subscribeToItems } from './items-config.js';

let currentChar = null;
let allItems = [];

export function renderShop(userId) {
    currentChar = window.selectedCharacter;
    const container = document.getElementById('shopContent');
    if (!container || container.classList.contains('hidden') || !currentChar || !currentChar.groupId) {
        container.innerHTML = '<p>ВЫ НЕ В ГРУППЕ</p>';
        return;
    }
    subscribeToItems(items => { allItems = items; });
    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === currentChar.groupId);
        if (!group || !group.shop) {
            container.innerHTML = '<p>МАГАЗИН НЕ НАСТРОЕН</p>';
            return;
        }
        renderShopUI(container, group.shop);
    });
}

let currentCategory = null, currentSubcategory = null;

function renderShopUI(container, shop) {
    const categories = shop.categories || {};
    const catNames = Object.keys(categories);
    if (catNames.length === 0) {
        container.innerHTML = '<p>МАГАЗИН ПУСТ</p>';
        return;
    }
    if (!currentCategory || !categories[currentCategory]) currentCategory = catNames[0];
    const subcats = categories[currentCategory]?.subcategories || {};
    const subNames = Object.keys(subcats);
    if (!currentSubcategory || !subcats[currentSubcategory]) currentSubcategory = subNames[0] || null;

    let html = '<div class="category-tabs">';
    catNames.forEach(cat => {
        html += `<button class="cat-tab" data-cat="${cat}" style="${cat === currentCategory ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">${cat.toUpperCase()}</button>`;
    });
    html += '</div>';
    if (subNames.length > 0) {
        html += '<div class="subcategory-tabs" style="display:flex; gap:4px; margin-bottom:10px; flex-wrap:wrap;">';
        subNames.forEach(sub => {
            html += `<button class="subcat-tab" data-sub="${sub}" style="font-size:9px; padding:6px 10px; background:var(--button-bg); color:var(--text-color); border:1px solid var(--border-color); cursor:pointer; ${sub === currentSubcategory ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">${sub}</button>`;
        });
        html += '</div>';
    }

    const items = currentSubcategory ? (subcats[currentSubcategory] || []) : [];
    html += '<div class="item-grid">';
    items.filter(item => !item.hidden).forEach(shopItem => {
        const itemData = allItems.find(i => i.id === shopItem.itemId);
        if (!itemData) return;
        const img = itemData.image ? `<img src="${itemData.image}" style="width:32px;height:32px;display:block;margin:0 auto 5px;">` : '';
        html += `
            <div class="item-card" id="buy_${shopItem.itemId}">
                ${img}
                <div>${itemData.name}</div>
                <small>${shopItem.price} РК</small>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    document.querySelectorAll('.cat-tab').forEach(btn => {
        btn.onclick = () => {
            currentCategory = btn.dataset.cat;
            currentSubcategory = null;
            renderShopUI(container, shop);
        };
    });
    document.querySelectorAll('.subcat-tab').forEach(btn => {
        btn.onclick = () => {
            currentSubcategory = btn.dataset.sub;
            renderShopUI(container, shop);
        };
    });
    items.filter(item => !item.hidden).forEach(shopItem => {
        const btn = document.getElementById(`buy_${shopItem.itemId}`);
        if (btn) btn.onclick = () => buyItem(shopItem);
    });
}

async function buyItem(shopItem) {
    if (!currentChar) return;
    const itemData = allItems.find(i => i.id === shopItem.itemId);
    if (!itemData) return;
    if (getTotalPink() < shopItem.price) {
        log('НЕДОСТАТОЧНО КРИСТАЛЛОВ');
        return;
    }
    if (!spendPink(shopItem.price)) {
        log('ОШИБКА ПРИ СПИСАНИИ');
        return;
    }
    const inventory = getInventory();
    const existing = inventory.find(i => i.itemId === shopItem.itemId && !i.durability);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        inventory.push({
            itemId: shopItem.itemId,
            name: itemData.name,
            image: itemData.image,
            quantity: 1,
            durability: itemData.tags?.includes('weapon') ? itemData.baseDurability : undefined
        });
    }
    await updateUserData(currentChar.userId, {
        currencies: getCurrencies(),
        inventory: [...inventory]
    });
    log(`КУПЛЕНО: ${itemData.name}. -${shopItem.price} РК.`);
}
