// admin/admin-items.js
import { log } from '../shared.js';
import { subscribeToItems, updateItems } from '../items-config.js';
import { getTagsCache } from './admin-main.js';

let itemsCache = [];

export function renderItemsAdmin(container) {
    const items = [...itemsCache];
    const tags = getTagsCache();
    
    let html = '<h3>БИБЛИОТЕКА ПРЕДМЕТОВ</h3>';
    
    html += `
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <input type="text" id="itemSearch" placeholder="ПОИСК ПО НАЗВАНИЮ" style="flex:1;">
            <select id="itemTagFilter" style="width:150px;">
                <option value="">ВСЕ ТЭГИ</option>
                ${tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
        </div>`;
    
    html += '<div id="itemsList" style="display:flex; flex-direction:column; gap:4px; max-height:300px; overflow-y:auto; margin-bottom:12px;"></div>';
    
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
            <h4 id="itemFormTitle">НОВЫЙ ПРЕДМЕТ</h4>
            <input type="text" id="itemName" placeholder="НАЗВАНИЕ">
            <input type="text" id="itemDesc" placeholder="ОПИСАНИЕ">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
                <input type="text" id="itemImage" placeholder="URL или BASE64" style="flex:1;">
                <input type="file" id="itemImageFile" accept="image/*" style="display:none;">
                <button id="uploadItemImageBtn" style="font-size:14px; padding:8px 10px; flex:none;">📁</button>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <input type="number" id="itemPrice" placeholder="БАЗОВАЯ ЦЕНА" style="flex:1;">
                <input type="number" id="itemDurability" placeholder="ПРОЧНОСТЬ (опц.)" style="flex:1;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="font-size:10px;">ТЭГИ:</label>
                <div id="itemTagsSelect" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
                <input type="checkbox" id="itemUnique" style="width:auto; margin:0;">
                <label style="font-size:10px;">УНИКАЛЬНЫЙ ПРЕДМЕТ</label>
            </div>
            <div style="display:flex; gap:8px;">
                <button id="saveItemBtn">СОХРАНИТЬ</button>
                <button id="cancelItemBtn" style="display:none;">ОТМЕНА</button>
            </div>
        </div>`;
    container.innerHTML = html;

    let editingId = null;
    let selectedTags = [];

    function renderList(filter = '', tagFilter = '') {
        const list = document.getElementById('itemsList');
        let filtered = items;
        if (filter) filtered = filtered.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));
        if (tagFilter) filtered = filtered.filter(i => (i.tags || []).includes(tagFilter));
        
        if (filtered.length === 0) {
            list.innerHTML = '<p style="font-size:10px; opacity:0.6;">НЕТ ПРЕДМЕТОВ</p>';
            return;
        }
        list.innerHTML = filtered.map(item => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color); font-size:10px;">
                <span style="display:flex; align-items:center; gap:6px;">
                    ${item.image ? `<img src="${item.image}" style="width:20px;height:20px;">` : ''}
                    <span>${item.name}</span>
                    <span style="font-size:8px; opacity:0.5;">${item.id}</span>
                    ${item.unique ? '<span style="color:#FFAA00; font-size:8px;">★</span>' : ''}
                </span>
                <div style="display:flex; gap:4px;">
                    <button data-id="${item.id}" class="editItemBtn" style="font-size:9px; padding:3px 6px; flex:none;">✏️</button>
                    <button data-id="${item.id}" class="deleteItemBtn" style="font-size:9px; padding:3px 6px; flex:none;">🗑️</button>
                </div>
            </div>`).join('');

        document.querySelectorAll('.editItemBtn').forEach(btn => {
            btn.onclick = () => loadItem(items.find(i => i.id === btn.dataset.id));
        });
        document.querySelectorAll('.deleteItemBtn').forEach(btn => {
            btn.onclick = async () => {
                const newItems = items.filter(i => i.id !== btn.dataset.id);
                await updateItems(newItems);
                log('ПРЕДМЕТ УДАЛЁН');
            };
        });
    }

    function renderTagCheckboxes() {
        const div = document.getElementById('itemTagsSelect');
        div.innerHTML = tags.map(tag => `
            <label style="display:flex; align-items:center; gap:3px; font-size:9px; cursor:pointer;">
                <input type="checkbox" value="${tag.id}" style="width:auto; margin:0;" ${selectedTags.includes(tag.id) ? 'checked' : ''}>
                <span style="width:10px;height:10px;background:${tag.color};border-radius:2px;display:inline-block;"></span>
                ${tag.name}
            </label>`).join('');
        
        div.querySelectorAll('input').forEach(cb => {
            cb.onchange = () => {
                if (cb.checked) selectedTags.push(cb.value);
                else selectedTags = selectedTags.filter(t => t !== cb.value);
            };
        });
    }

    function loadItem(item) {
        editingId = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDesc').value = item.description || '';
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemPrice').value = item.basePrice || 0;
        document.getElementById('itemDurability').value = item.baseDurability || '';
        document.getElementById('itemUnique').checked = item.unique || false;
        selectedTags = [...(item.tags || [])];
        document.getElementById('itemFormTitle').innerText = 'РЕДАКТИРОВАНИЕ';
        document.getElementById('cancelItemBtn').style.display = 'inline-block';
        renderTagCheckboxes();
    }

    function clearForm() {
        editingId = null;
        document.getElementById('itemName').value = '';
        document.getElementById('itemDesc').value = '';
        document.getElementById('itemImage').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemDurability').value = '';
        document.getElementById('itemUnique').checked = false;
        selectedTags = [];
        document.getElementById('itemFormTitle').innerText = 'НОВЫЙ ПРЕДМЕТ';
        document.getElementById('cancelItemBtn').style.display = 'none';
        renderTagCheckboxes();
    }

    document.getElementById('uploadItemImageBtn').onclick = () => document.getElementById('itemImageFile').click();
    document.getElementById('itemImageFile').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024) { log('ОШИБКА: ФАЙЛ > 500 КБ'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => document.getElementById('itemImage').value = ev.target.result;
        reader.readAsDataURL(file);
    };

    document.getElementById('itemSearch').oninput = () => renderList(
        document.getElementById('itemSearch').value,
        document.getElementById('itemTagFilter').value
    );
    document.getElementById('itemTagFilter').onchange = () => renderList(
        document.getElementById('itemSearch').value,
        document.getElementById('itemTagFilter').value
    );

    document.getElementById('saveItemBtn').onclick = async () => {
        const name = document.getElementById('itemName').value.trim();
        if (!name) return;
        
        const itemData = {
            id: editingId || 'item_' + Date.now(),
            name,
            description: document.getElementById('itemDesc').value.trim(),
            image: document.getElementById('itemImage').value.trim(),
            basePrice: parseInt(document.getElementById('itemPrice').value) || 0,
            baseDurability: parseInt(document.getElementById('itemDurability').value) || undefined,
            tags: selectedTags,
            unique: document.getElementById('itemUnique').checked
        };

        let newItems;
        if (editingId) {
            newItems = items.map(i => i.id === editingId ? itemData : i);
        } else {
            if (items.find(i => i.id === itemData.id)) {
                log('ПРЕДМЕТ С ТАКИМ ID УЖЕ ЕСТЬ');
                return;
            }
            newItems = [...items, itemData];
        }

        await updateItems(newItems);
        log(`ПРЕДМЕТ "${name}" СОХРАНЁН`);
        clearForm();
    };

    document.getElementById('cancelItemBtn').onclick = clearForm;

    renderList();
    renderTagCheckboxes();
}

subscribeToItems(items => {
    itemsCache = items;
});
