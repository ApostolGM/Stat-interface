// admin/admin-shop.js
import { log } from '../shared.js';
import { updateGroupData } from '../groups-config.js';
import { subscribeToItems } from '../items-config.js';

let selectedCategory = null;
let selectedSubcategory = null;

export function renderShopAdmin(group, container) {
    const shop = group.shop || { categories: {} };
    const categories = shop.categories || {};
    const catNames = Object.keys(categories);

    // Если категорий нет — показываем форму создания
    if (catNames.length === 0) {
        container.innerHTML = `
            <h3>МАГАЗИН</h3>
            <p style="opacity:0.6;">НЕТ КАТЕГОРИЙ. СОЗДАЙТЕ ПЕРВУЮ:</p>
            <div style="display:flex; gap:10px;">
                <input type="text" id="newCatName" placeholder="НАЗВАНИЕ КАТЕГОРИИ" style="flex:1;">
                <button id="addCatBtn">СОЗДАТЬ</button>
            </div>
        `;
        document.getElementById('addCatBtn').onclick = async () => {
            const name = document.getElementById('newCatName').value.trim();
            if (!name) return;
            const newCat = { ...categories, [name]: { subcategories: {} } };
            await updateGroupData(group.id, { shop: { categories: newCat } });
            log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
            renderShopAdmin(group, container);
        };
        return;
    }

    if (!selectedCategory || !categories[selectedCategory]) {
        selectedCategory = catNames[0];
        selectedSubcategory = null;
    }

    if (!selectedSubcategory) {
        // Показываем подкатегории
        const subcats = categories[selectedCategory]?.subcategories || {};
        const subNames = Object.keys(subcats);
        
        let html = '<h3>КАТЕГОРИИ</h3>';
        html += '<div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">';
        catNames.forEach(cat => {
            html += `<button class="cat-tab-btn" data-cat="${cat}" style="font-size:10px; padding:8px 12px; ${cat === selectedCategory ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">${cat}</button>`;
        });
        html += '</div>';
        
        html += `<h4>${selectedCategory} → ПОДКАТЕГОРИИ</h4>`;
        html += '<div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">';
        if (subNames.length === 0) {
            html += '<p style="opacity:0.5;">НЕТ ПОДКАТЕГОРИЙ</p>';
        } else {
            subNames.forEach(sub => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border-color); cursor:pointer;" class="selectSubBtn" data-sub="${sub}">
                        <span>📂 ${sub} (${subcats[sub].length})</span>
                        <button class="deleteSubBtn" data-sub="${sub}" style="font-size:9px; padding:3px 6px; flex:none;">🗑️</button>
                    </div>`;
            });
        }
        html += '</div>';
        
        html += `
            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <input type="text" id="newSubName" placeholder="НОВАЯ ПОДКАТЕГОРИЯ" style="flex:1;">
                <button id="addSubBtn">СОЗДАТЬ</button>
            </div>
        `;
        
        html += `
            <div style="border-top:1px solid var(--border-color); padding-top:10px; margin-top:10px;">
                <h4>НОВАЯ КАТЕГОРИЯ</h4>
                <div style="display:flex; gap:8px;">
                    <input type="text" id="newCatName" placeholder="НАЗВАНИЕ" style="flex:1;">
                    <button id="addCatBtn">СОЗДАТЬ</button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;

        // Обработчики категорий
        document.querySelectorAll('.cat-tab-btn').forEach(btn => {
            btn.onclick = () => {
                selectedCategory = btn.dataset.cat;
                selectedSubcategory = null;
                renderShopAdmin(group, container);
            };
        });

        // Обработчики подкатегорий
        document.querySelectorAll('.selectSubBtn').forEach(div => {
            div.onclick = (e) => {
                if (e.target.classList.contains('deleteSubBtn')) return;
                selectedSubcategory = div.dataset.sub;
                renderShopAdmin(group, container);
            };
        });

        // Удаление подкатегорий
        document.querySelectorAll('.deleteSubBtn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const sub = btn.dataset.sub;
                const newCat = JSON.parse(JSON.stringify(categories));
                delete newCat[selectedCategory].subcategories[sub];
                await updateGroupData(group.id, { shop: { categories: newCat } });
                log(`ПОДКАТЕГОРИЯ "${sub}" УДАЛЕНА`);
                renderShopAdmin(group, container);
            };
        });

        // Создание подкатегории
        document.getElementById('addSubBtn').onclick = async () => {
            const name = document.getElementById('newSubName').value.trim();
            if (!name || subcats[name]) return;
            const newCat = JSON.parse(JSON.stringify(categories));
            newCat[selectedCategory].subcategories[name] = [];
            await updateGroupData(group.id, { shop: { categories: newCat } });
            log(`ПОДКАТЕГОРИЯ "${name}" СОЗДАНА`);
            renderShopAdmin(group, container);
        };

        // Создание новой категории
        document.getElementById('addCatBtn').onclick = async () => {
            const name = document.getElementById('newCatName').value.trim();
            if (!name || categories[name]) return;
            const newCat = { ...categories, [name]: { subcategories: {} } };
            await updateGroupData(group.id, { shop: { categories: newCat } });
            log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
            selectedCategory = name;
            selectedSubcategory = null;
            renderShopAdmin(group, container);
        };

    } else {
        // Показываем товары в подкатегории
        const items = categories[selectedCategory].subcategories[selectedSubcategory] || [];
        let html = `<button id="backToSub" style="margin-bottom:10px;">← К ПОДКАТЕГОРИЯМ</button>`;
        html += `<h3>${selectedCategory} → ${selectedSubcategory}</h3>`;
        
        html += '<div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">';
        if (items.length === 0) {
            html += '<p style="opacity:0.5;">НЕТ ТОВАРОВ</p>';
        } else {
            items.forEach((item, index) => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color); font-size:10px;">
                        <span>${item.itemId} — ${item.price} РК ${item.hidden ? '(СКРЫТ)' : ''}</span>
                        <div style="display:flex; gap:4px;">
                            <button data-index="${index}" class="toggleHiddenBtn" style="font-size:8px; padding:2px 5px;">${item.hidden ? '👁' : '🙈'}</button>
                            <button data-index="${index}" class="removeItemBtn" style="font-size:8px; padding:2px 5px;">🗑️</button>
                        </div>
                    </div>`;
            });
        }
        html += '</div>';

        html += `
            <div style="border-top:1px solid var(--border-color); padding-top:10px;">
                <h4>ДОБАВИТЬ ТОВАР</h4>
                <div style="display:flex; gap:8px;">
                    <select id="newItemSelect" style="flex:1;"><option value="">ВЫБЕРИТЕ ПРЕДМЕТ</option></select>
                    <input type="number" id="newItemPrice" placeholder="ЦЕНА" style="width:80px;">
                    <button id="addItemBtn">ДОБАВИТЬ</button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Заполняем select предметами
        subscribeToItems(allItems => {
            const select = document.getElementById('newItemSelect');
            if (!select) return;
            select.innerHTML = '<option value="">ВЫБЕРИТЕ ПРЕДМЕТ</option>';
            allItems.forEach(item => {
                select.innerHTML += `<option value="${item.id}">${item.name} (${item.basePrice} РК)</option>`;
            });
        });

        document.getElementById('backToSub').onclick = () => {
            selectedSubcategory = null;
            renderShopAdmin(group, container);
        };

        // Скрыть/показать товар
        document.querySelectorAll('.toggleHiddenBtn').forEach(btn => {
            btn.onclick = async () => {
                const idx = parseInt(btn.dataset.index);
                items[idx].hidden = !items[idx].hidden;
                const newCat = JSON.parse(JSON.stringify(categories));
                newCat[selectedCategory].subcategories[selectedSubcategory] = [...items];
                await updateGroupData(group.id, { shop: { categories: newCat } });
                renderShopAdmin(group, container);
            };
        });

        // Удалить товар
        document.querySelectorAll('.removeItemBtn').forEach(btn => {
            btn.onclick = async () => {
                const idx = parseInt(btn.dataset.index);
                const newItems = items.filter((_, i) => i !== idx);
                const newCat = JSON.parse(JSON.stringify(categories));
                newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
                await updateGroupData(group.id, { shop: { categories: newCat } });
                log('ТОВАР УДАЛЁН');
                renderShopAdmin(group, container);
            };
        });

        // Добавить товар
        document.getElementById('addItemBtn').onclick = async () => {
            const itemId = document.getElementById('newItemSelect').value;
            const price = parseInt(document.getElementById('newItemPrice').value);
            if (!itemId || isNaN(price)) return;
            const newItems = [...items, { itemId, price, hidden: false }];
            const newCat = JSON.parse(JSON.stringify(categories));
            newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
            await updateGroupData(group.id, { shop: { categories: newCat } });
            log('ТОВАР ДОБАВЛЕН');
            renderShopAdmin(group, container);
        };
    }
}

export function resetShopAdmin() {
    selectedCategory = null;
    selectedSubcategory = null;
}