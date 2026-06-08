// admin/admin-shop.js
import { log } from '../shared.js';
import { updateGroupData } from '../groups-config.js';
import { subscribeToItems } from '../items-config.js';

let selectedCategory = null;
let selectedSubcategory = null;

export function renderShopAdmin(group, container) {
    const shop = group.shop || { categories: {} };
    const categories = shop.categories;
    if (!categories || Object.keys(categories).length === 0) {
    // Показываем форму создания первой категории
    let html = '<h3>КАТЕГОРИИ</h3><p>МАГАЗИН ПУСТ. СОЗДАЙТЕ ПЕРВУЮ КАТЕГОРИЮ.</p>';
    html += `<div style="display:flex; gap:10px; margin-top:12px;"><input type="text" id="newCatName" placeholder="НОВАЯ КАТЕГОРИЯ" style="flex:1;"><button id="addCatBtn">СОЗДАТЬ</button></div>`;
    container.innerHTML = html;
    
    document.getElementById('addCatBtn').onclick = async () => {
        const name = document.getElementById('newCatName').value.trim();
        if (!name) return;
        const newCat = { ...categories, [name]: { subcategories: {} } };
        await saveShop(group, newCat);
        log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
    };
    return;

    if (!selectedCategory) {
        renderCategories(container, categories, group);
    } else if (!selectedSubcategory) {
        renderSubcategories(container, categories, group);
    } else {
        renderItems(container, categories, group);
    }
}

async function saveShop(group, newCategories) {
    await updateGroupData(group.id, { shop: { categories: newCategories } });
}

function renderCategories(container, categories, group) {
    const catNames = Object.keys(categories);
    let html = '<h3>КАТЕГОРИИ</h3><div style="display:flex; flex-direction:column; gap:6px;">';
    catNames.forEach(cat => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border:1px solid var(--border-color); cursor:pointer;" class="selectCatBtn" data-cat="${cat}">
                <span>📁 ${cat}</span>
                <button class="deleteCatBtn" data-cat="${cat}" style="font-size:10px; padding:4px 6px; flex:none;">УДАЛИТЬ</button>
            </div>`;
    });
    html += '</div>';
    html += `<div style="display:flex; gap:10px; margin-top:12px;"><input type="text" id="newCatName" placeholder="НОВАЯ КАТЕГОРИЯ" style="flex:1;"><button id="addCatBtn">СОЗДАТЬ</button></div>`;
    container.innerHTML = html;

    document.querySelectorAll('.selectCatBtn').forEach(div => {
        div.onclick = (e) => {
            if (e.target.classList.contains('deleteCatBtn')) return;
            selectedCategory = div.dataset.cat;
            selectedSubcategory = null;
            renderShopAdmin(group, container);
        };
    });
    document.querySelectorAll('.deleteCatBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const newCat = { ...categories };
            delete newCat[btn.dataset.cat];
            await saveShop(group, newCat);
            log('КАТЕГОРИЯ УДАЛЕНА');
        };
    });
    document.getElementById('addCatBtn').onclick = async () => {
        const name = document.getElementById('newCatName').value.trim();
        if (!name || categories[name]) return;
        const newCat = { ...categories, [name]: { subcategories: {} } };
        await saveShop(group, newCat);
        log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
    };
}

function renderSubcategories(container, categories, group) {
    const subcats = categories[selectedCategory]?.subcategories || {};
    const subNames = Object.keys(subcats);
    let html = `<button id="backToCat" style="margin-bottom:10px;">← К КАТЕГОРИЯМ</button>`;
    html += `<h3>${selectedCategory} → ПОДКАТЕГОРИИ</h3>`;
    html += '<div style="display:flex; flex-direction:column; gap:6px;">';
    subNames.forEach(sub => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border:1px solid var(--border-color); cursor:pointer;" class="selectSubBtn" data-sub="${sub}">
                <span>📂 ${sub} (${subcats[sub].length} товаров)</span>
                <button class="deleteSubBtn" data-sub="${sub}" style="font-size:10px; padding:4px 6px; flex:none;">УДАЛИТЬ</button>
            </div>`;
    });
    html += '</div>';
    html += `<div style="display:flex; gap:10px; margin-top:12px;"><input type="text" id="newSubName" placeholder="НОВАЯ ПОДКАТЕГОРИЯ" style="flex:1;"><button id="addSubBtn">СОЗДАТЬ</button></div>`;
    container.innerHTML = html;

    document.getElementById('backToCat').onclick = () => { selectedCategory = null; renderShopAdmin(group, container); };
    document.querySelectorAll('.selectSubBtn').forEach(div => {
        div.onclick = (e) => {
            if (e.target.classList.contains('deleteSubBtn')) return;
            selectedSubcategory = div.dataset.sub;
            renderShopAdmin(group, container);
        };
    });
    document.querySelectorAll('.deleteSubBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const newCat = { ...categories };
            delete newCat[selectedCategory].subcategories[btn.dataset.sub];
            await saveShop(group, newCat);
            log('ПОДКАТЕГОРИЯ УДАЛЕНА');
        };
    });
    document.getElementById('addSubBtn').onclick = async () => {
        const name = document.getElementById('newSubName').value.trim();
        if (!name || subcats[name]) return;
        const newCat = { ...categories };
        newCat[selectedCategory].subcategories[name] = [];
        await saveShop(group, newCat);
        log(`ПОДКАТЕГОРИЯ "${name}" СОЗДАНА`);
    };
}

function renderItems(container, categories, group) {
    const items = categories[selectedCategory].subcategories[selectedSubcategory] || [];
    let html = `<button id="backToSub" style="margin-bottom:10px;">← К ПОДКАТЕГОРИЯМ</button>`;
    html += `<h3>${selectedCategory} → ${selectedSubcategory}</h3>`;
    html += '<div style="display:flex; flex-direction:column; gap:4px;">';
    items.forEach((item, index) => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color); font-size:11px;">
                <span>${item.itemId} — ${item.price} РК ${item.hidden ? '(скрыт)' : ''}</span>
                <button data-index="${index}" class="removeItemBtn">УДАЛИТЬ</button>
                <button data-index="${index}" class="toggleHiddenBtn">${item.hidden ? 'ПОКАЗАТЬ' : 'СКРЫТЬ'}</button>
            </div>`;
    });
    html += '</div>';
    html += `
        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
            <select id="newItemSelect" style="flex:1; min-width:150px;"><option value="">ВЫБЕРИТЕ ПРЕДМЕТ</option></select>
            <input type="number" id="newItemPrice" placeholder="ЦЕНА" style="width:80px;">
            <button id="addItemBtn">ДОБАВИТЬ</button>
        </div>`;
    container.innerHTML = html;

    subscribeToItems(allItems => {
        const select = document.getElementById('newItemSelect');
        if (!select) return;
        select.innerHTML = '<option value="">ВЫБЕРИТЕ ПРЕДМЕТ</option>';
        allItems.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.name} (база: ${item.basePrice} РК)</option>`;
        });
    });

    document.getElementById('backToSub').onclick = () => { selectedSubcategory = null; renderShopAdmin(group, container); };
    document.querySelectorAll('.removeItemBtn').forEach(btn => {
        btn.onclick = async () => {
            const index = parseInt(btn.dataset.index);
            const newItems = [...items];
            newItems.splice(index, 1);
            const newCat = { ...categories };
            newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
            await saveShop(group, newCat);
            log('ТОВАР УДАЛЁН');
        };
    });
    document.querySelectorAll('.toggleHiddenBtn').forEach(btn => {
        btn.onclick = async () => {
            const index = parseInt(btn.dataset.index);
            items[index].hidden = !items[index].hidden;
            const newCat = { ...categories };
            newCat[selectedCategory].subcategories[selectedSubcategory] = [...items];
            await saveShop(group, newCat);
            log(items[index].hidden ? 'ТОВАР СКРЫТ' : 'ТОВАР ОТОБРАЖАЕТСЯ');
        };
    });
    document.getElementById('addItemBtn').onclick = async () => {
        const itemId = document.getElementById('newItemSelect').value;
        const price = parseInt(document.getElementById('newItemPrice').value);
        if (!itemId || isNaN(price)) return;
        const newItems = [...items, { itemId, price, hidden: false }];
        const newCat = { ...categories };
        newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
        await saveShop(group, newCat);
        log('ТОВАР ДОБАВЛЕН');
    };
}

export function resetShopAdmin() {
    selectedCategory = null;
    selectedSubcategory = null;
}
