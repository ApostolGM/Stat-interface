// admin/admin-shop.js
import { log } from '../shared.js';
import { updateShopCategories } from '../shop-config.js';
import { getShopCategories } from './admin-main.js';

let selectedCategory = null;
let selectedSubcategory = null;

export function resetShopAdmin() {
    selectedCategory = null;
    selectedSubcategory = null;
}

export function renderShopAdmin() {
    const inner = document.getElementById('adminInnerContent');
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
    let html = `<button id="backToSub" style="margin-bottom:10px;">← К ПОДКАТЕГОРИЯМ</button>`;
    html += `<h3>${selectedCategory} → ${selectedSubcategory}</h3>`;
    
    // Список существующих товаров
    if (items.length > 0) {
        html += '<div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">';
        items.forEach((item, index) => {
            const imgTag = item.image 
                ? `<img src="${item.image}" style="width:24px;height:24px;vertical-align:middle;margin-right:4px;object-fit:contain;">` 
                : '';
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color); font-size:11px;">
                    <span>${imgTag}${item.name} — ${item.price} РК</span>
                    <span style="font-size:9px; opacity:0.7;">${(item.tags || []).join(', ')}</span>
                    <button data-index="${index}" class="removeItemBtn">УДАЛИТЬ</button>
                </div>`;
        });
        html += '</div>';
    } else {
        html += '<p style="font-size:11px; opacity:0.6;">НЕТ ТОВАРОВ</p>';
    }

    // Форма добавления
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:10px;">
            <h4>ДОБАВИТЬ ТОВАР</h4>
            <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <input type="text" id="newItemName" placeholder="НАЗВАНИЕ" style="flex:1; min-width:120px;">
                <div style="display:flex; gap:4px; align-items:center; flex:2; min-width:220px;">
                    <input type="text" id="newItemImage" placeholder="URL или Base64 картинки" style="flex:1;">
                    <input type="file" id="newItemImageFile" accept="image/*" style="display:none;">
                    <button id="uploadImageBtn" style="font-size:16px; padding:8px 12px; flex:none;" title="ЗАГРУЗИТЬ С КОМПЬЮТЕРА">📁</button>
                </div>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <input type="number" id="newItemPrice" placeholder="ЦЕНА В РК" style="width:100px;">
                <input type="text" id="newItemTags" placeholder="ТЕГИ (через запятую)" style="flex:1; min-width:150px;">
                <button id="addItemBtn">ДОБАВИТЬ</button>
            </div>
            <div id="imagePreview" style="margin-top:6px;"></div>
        </div>`;
    inner.innerHTML = html;

    // Удаление товара
    document.querySelectorAll('.removeItemBtn').forEach(btn => {
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

    // Загрузка картинки
    document.getElementById('uploadImageBtn').onclick = () => {
        document.getElementById('newItemImageFile').click();
    };

    document.getElementById('newItemImageFile').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 500 * 1024) {
            log('ОШИБКА: ФАЙЛ СЛИШКОМ БОЛЬШОЙ (МАКС 500 КБ)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('newItemImage').value = ev.target.result;
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${ev.target.result}" style="max-width:100px; max-height:100px; border:1px solid var(--border-color);">`;
            log('КАРТИНКА ЗАГРУЖЕНА');
        };
        reader.readAsDataURL(file);
    };

    // Кнопка "Назад"
    document.getElementById('backToSub').onclick = () => { 
        selectedSubcategory = null; 
        renderShopAdmin(); 
    };

    // Добавление товара
    document.getElementById('addItemBtn').onclick = async () => {
        const name = document.getElementById('newItemName').value.trim();
        const image = document.getElementById('newItemImage').value.trim();
        const price = parseInt(document.getElementById('newItemPrice').value);
        const tags = document.getElementById('newItemTags').value.split(',').map(t => t.trim()).filter(t => t);
        
        if (!name || isNaN(price)) {
            log('ОШИБКА: ЗАПОЛНИТЕ НАЗВАНИЕ И ЦЕНУ');
            return;
        }
        
        const newItem = { 
            id: Date.now().toString(), 
            name, 
            image, 
            price, 
            tags 
        };
        
        const newItems = [...items, newItem];
        const newCat = { ...cats };
        newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
        await updateShopCategories(newCat);
        log(`ТОВАР "${name}" ДОБАВЛЕН`);
        
        // Очистка полей
        document.getElementById('newItemName').value = '';
        document.getElementById('newItemImage').value = '';
        document.getElementById('newItemPrice').value = '';
        document.getElementById('newItemTags').value = '';
        document.getElementById('imagePreview').innerHTML = '';
    };
}
