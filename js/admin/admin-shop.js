// admin/admin-shop.js
import { log } from '../shared.js';
import { updateShopCategories } from '../shop-config.js';
import { getShopCategories } from './admin-main.js';
import { subscribeToItems } from '../items-config.js';

let selectedCategory = null;
let selectedSubcategory = null;

export function resetShopAdmin() {
    selectedCategory = null;
    selectedSubcategory = null;
}

export function renderShopAdmin() {
    const inner = document.getElementById('adminPanelContent');
    const shopCategories = getShopCategories();
    if (!shopCategories || Object.keys(shopCategories).length === 0) {
        inner.innerHTML = '<p>МАГАЗИН ПУСТ</p>';
        return;
    }

    if (!selectedCategory) {
        renderCategories(inner, shopCategories);
    } else if (!selectedSubcategory) {
        renderSubcategories(inner, shopCategories);
    } else {
        renderItems(inner, shopCategories);
    }
}

function renderCategories(inner, cats) {
    const catNames = Object.keys(cats);
    let html = '<h3>КАТЕГОРИИ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px;">';
    catNames.forEach(cat => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:12px; border:1px solid var(--border-color); cursor:pointer;" class="selectCatBtn" data-cat="${cat}">
                <span>📁 ${cat}</span>
                <button class="deleteCatBtn" data-cat="${cat}" style="font-size:10px; padding:5px 8px; flex:none;">🗑️</button>
            </div>`;
    });
    html += '</div>';
    html += `
        <div style="display:flex; gap:10px; margin-top:15px;">
            <input type="text" id="newCatName" placeholder="НОВАЯ КАТЕГОРИЯ" style="flex:1;">
            <button id="addCatBtn">СОЗДАТЬ</button>
        </div>`;
    inner.innerHTML = html;

    document.querySelectorAll('.selectCatBtn').forEach(div => {
        div.onclick = (e) => {
            if (e.target.classList.contains('deleteCatBtn')) return;
            selectedCategory = div.dataset.cat;
            selectedSubcategory = null;
            renderShopAdmin();
        };
    });

    document.querySelectorAll('.deleteCatBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const newCat = { ...cats };
            delete newCat[btn.dataset.cat];
            await updateShopCategories(newCat);
            log('КАТЕГОРИЯ УДАЛЕНА');
        };
    });

    document.getElementById('addCatBtn').onclick = async () => {
        const name = document.getElementById('newCatName').value.trim();
        if (!name || cats[name]) return;
        const newCat = { ...cats, [name]: { subcategories: {} } };
        await updateShopCategories(newCat);
        log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
    };
}

function renderSubcategories(inner, cats) {
    const subcats = cats[selectedCategory]?.subcategories || {};
    const subNames = Object.keys(subcats);
    let html = `<button id="backToCat" style="margin-bottom:12px;">← К КАТЕГОРИЯМ</button>`;
    html += `<h3>${selectedCategory} → ПОДКАТЕГОРИИ</h3>`;
    html += '<div style="display:flex; flex-direction:column; gap:8px;">';
    subNames.forEach(sub => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:12px; border:1px solid var(--border-color); cursor:pointer;" class="selectSubBtn" data-sub="${sub}">
                <span>📂 ${sub} (${subcats[sub].length} товаров)</span>
                <button class="deleteSubBtn" data-sub="${sub}" style="font-size:10px; padding:5px 8px; flex:none;">🗑️</button>
            </div>`;
    });
    html += '</div>';
    html += `
        <div style="display:flex; gap:10px; margin-top:15px;">
            <input type="text" id="newSubName" placeholder="НОВАЯ ПОДКАТЕГОРИЯ" style="flex:1;">
            <button id="addSubBtn">СОЗДАТЬ</button>
        </div>`;
    inner.innerHTML = html;

    document.getElementById('backToCat').onclick = () => { selectedCategory = null; renderShopAdmin(); };

    document.querySelectorAll('.selectSubBtn').forEach(div => {
        div.onclick = (e) => {
            if (e.target.classList.contains('deleteSubBtn')) return;
            selectedSubcategory = div.dataset.sub;
            renderShopAdmin();
        };
    });

    document.querySelectorAll('.deleteSubBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const newCat = { ...cats };
            delete newCat[selectedCategory].subcategories[btn.dataset.sub];
            await updateShopCategories(newCat);
            log('ПОДКАТЕГОРИЯ УДАЛЕНА');
        };
    });

    document.getElementById('addSubBtn').onclick = async () => {
        const name = document.getElementById('newSubName').value.trim();
        if (!name || subcats[name]) return;
        const newCat = { ...cats };
        newCat[selectedCategory].subcategories[name] = [];
        await updateShopCategories(newCat);
        log(`ПОДКАТЕГОРИЯ "${name}" СОЗДАНА`);
    };
}

function renderItems(inner, cats) {
    const items = cats[selectedCategory].subcategories[selectedSubcategory] || [];
    
    let html = `<button id="backToSub" style="margin-bottom:12px;">← К ПОДКАТЕГОРИЯМ</button>`;
    html += `<h3>${selectedCategory} → ${selectedSubcategory}</h3>`;
    
    // Список товаров
    html += '<div style="display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; margin-bottom:15px;">';
    if (items.length === 0) {
        html += '<p style="opacity:0.6;">НЕТ ТОВАРОВ</p>';
    } else {
        // Получаем библиотеку предметов для отображения названий
        subscribeToItems(allItems => {
            const listDiv = document.getElementById('shopItemsList');
            if (!listDiv) return;
            listDiv.innerHTML = items.map((shopItem, index) => {
                const itemData = allItems.find(i => i.id === shopItem.itemId);
                const name = itemData ? itemData.name : shopItem.itemId;
                const image = itemData?.image || '';
                const hidden = shopItem.hidden ? ' (скрыт)' : '';
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border-color); font-size:11px;">
                        <span>
                            ${image ? `<img src="${image}" style="width:20px;height:20px;vertical-align:middle;"> ` : ''}
                            ${name} — ${shopItem.price} РК
                            <span style="font-size:9px; opacity:0.5;">${hidden}</span>
                        </span>
                        <div style="display:flex; gap:4px;">
                            <button data-index="${index}" class="toggleHiddenBtn" style="font-size:9px; padding:3px 6px; flex:none;">
                                ${shopItem.hidden ? '👁' : '🙈'}
                            </button>
                            <button data-index="${index}" class="removeItemBtn" style="font-size:9px; padding:3px 6px; flex:none;">🗑️</button>
                        </div>
                    </div>`;
            }).join('');

            // Обработчики скрытия/показа
            listDiv.querySelectorAll('.toggleHiddenBtn').forEach(btn => {
                btn.onclick = async () => {
                    const index = parseInt(btn.dataset.index);
                    items[index].hidden = !items[index].hidden;
                    const newCat = { ...cats };
                    newCat[selectedCategory].subcategories[selectedSubcategory] = [...items];
                    await updateShopCategories(newCat);
                    log(items[index].hidden ? 'ТОВАР СКРЫТ' : 'ТОВАР ОТОБРАЖАЕТСЯ');
                };
            });

            // Обработчики удаления
            listDiv.querySelectorAll('.removeItemBtn').forEach(btn => {
                btn.onclick = async () => {
                    const index = parseInt(btn.dataset.index);
                    const newItems = [...items];
                    newItems.splice(index, 1);
                    const newCat = { ...cats };
                    newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
                    await updateShopCategories(newCat);
                    log('ТОВАР УДАЛЁН');
                };
            });
        });
    }
    html += '<div id="shopItemsList"></div>';
    html += '</div>';

    // Форма добавления товара (выбор из библиотеки)
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:15px;">
            <h4>ДОБАВИТЬ ТОВАР</h4>
            <select id="newItemSelect" style="margin-bottom:10px; width:100%;">
                <option value="">ВЫБЕРИТЕ ПРЕДМЕТ ИЗ БИБЛИОТЕКИ</option>
            </select>
            <div style="display:flex; gap:8px;">
                <input type="number" id="newItemPrice" placeholder="ЦЕНА В РК" style="flex:1;">
                <button id="addItemBtn">ДОБАВИТЬ</button>
            </div>
        </div>`;
    inner.innerHTML = html;

    // Заполняем select предметами из библиотеки
    subscribeToItems(allItems => {
        const select = document.getElementById('newItemSelect');
        if (!select) return;
        select.innerHTML = '<option value="">ВЫБЕРИТЕ ПРЕДМЕТ ИЗ БИБЛИОТЕКИ</option>';
        allItems.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.name} (база: ${item.basePrice} РК)</option>`;
        });
    });

    document.getElementById('backToSub').onclick = () => { selectedSubcategory = null; renderShopAdmin(); };

    document.getElementById('addItemBtn').onclick = async () => {
        const itemId = document.getElementById('newItemSelect').value;
        const price = parseInt(document.getElementById('newItemPrice').value);
        if (!itemId || isNaN(price)) {
            log('ВЫБЕРИТЕ ПРЕДМЕТ И УКАЖИТЕ ЦЕНУ');
            return;
        }
        const newItem = { itemId, price, hidden: false };
        const newItems = [...items, newItem];
        const newCat = { ...cats };
        newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
        await updateShopCategories(newCat);
        log('ТОВАР ДОБАВЛЕН В МАГАЗИН');
        document.getElementById('newItemPrice').value = '';
    };
}
