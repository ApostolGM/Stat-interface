// admin/admin-lootboxes.js
import { log } from '../shared.js';
import { updateLootboxes } from '../lootbox-config.js';
import { getLootboxesCache } from './admin-main.js';

export function renderLootboxAdmin() {
    const inner = document.getElementById('adminInnerContent');
    const lootboxes = [...getLootboxesCache()];
    
    let html = '<h3>КОНСТРУКТОР ЛУТБОКСОВ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; margin-bottom:12px;">';
    
    if (lootboxes.length === 0) {
        html += '<p>НЕТ СОЗДАННЫХ ЛУТБОКСОВ</p>';
    } else {
        lootboxes.forEach((box, index) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border-color);">
                    <span>📦 ${box.name} — ${box.price} РК (${box.items.length} предметов)</span>
                    <div style="display:flex; gap:5px;">
                        <button data-index="${index}" class="editLootBtn">✏️</button>
                        <button data-index="${index}" class="deleteLootBtn">🗑️</button>
                    </div>
                </div>`;
        });
    }
    html += '</div>';
    
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
            <h4 id="lootFormTitle">НОВЫЙ ЛУТБОКС</h4>
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <input type="text" id="lootName" placeholder="НАЗВАНИЕ" style="flex:1;">
                <input type="text" id="lootImage" placeholder="URL КАРТИНКИ" style="flex:1;">
                <input type="number" id="lootPrice" placeholder="ЦЕНА В РК" style="width:100px;">
            </div>
            <h4>ПРЕДМЕТЫ (название | картинка | шанс)</h4>
            <div id="lootItemsList" style="display:flex; flex-direction:column; gap:4px; max-height:150px; overflow-y:auto; margin-bottom:8px;"></div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="newLootItemName" placeholder="Название" style="flex:1;">
                <input type="text" id="newLootItemImage" placeholder="URL картинки" style="width:100px;">
                <input type="number" id="newLootItemChance" placeholder="Шанс" style="width:60px;" value="10">
                <button id="addLootItemBtn">+</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button id="saveLootBtn">СОХРАНИТЬ</button>
                <button id="cancelLootBtn" style="display:none;">ОТМЕНА</button>
            </div>
        </div>`;
    inner.innerHTML = html;

    let editingIndex = -1;
    let tempItems = [];

    function renderItems() {
        const list = document.getElementById('lootItemsList');
        if (!list) return;
        list.innerHTML = '';
        if (tempItems.length === 0) {
            list.innerHTML = '<p style="font-size:10px; opacity:0.6;">НЕТ ПРЕДМЕТОВ</p>';
            return;
        }
        tempItems.forEach((item, i) => {
            list.innerHTML += `
                <div style="display:flex; gap:4px; align-items:center; font-size:10px; background:var(--card-bg); padding:4px 6px; border:1px solid var(--border-color);">
                    <span style="flex:1;">${item.name}</span>
                    ${item.image ? `<img src="${item.image}" style="width:16px;height:16px;">` : ''}
                    <span style="width:60px; text-align:right;">шанс: ${item.chance}</span>
                    <button data-i="${i}" class="removeLootItemBtn" style="font-size:10px; padding:2px 5px; flex:none;">×</button>
                </div>`;
        });
        document.querySelectorAll('.removeLootItemBtn').forEach(btn => {
            btn.onclick = () => {
                tempItems.splice(parseInt(btn.dataset.i), 1);
                renderItems();
            };
        });
    }

    document.getElementById('addLootItemBtn').onclick = () => {
        const name = document.getElementById('newLootItemName').value.trim();
        const image = document.getElementById('newLootItemImage').value.trim();
        const chance = parseInt(document.getElementById('newLootItemChance').value);
        if (!name || isNaN(chance) || chance <= 0) return;
        tempItems.push({ name, image, chance });
        document.getElementById('newLootItemName').value = '';
        document.getElementById('newLootItemImage').value = '';
        document.getElementById('newLootItemChance').value = '10';
        renderItems();
    };

    function loadBox(box) {
        document.getElementById('lootName').value = box.name;
        document.getElementById('lootImage').value = box.image || '';
        document.getElementById('lootPrice').value = box.price;
        tempItems = JSON.parse(JSON.stringify(box.items));
        renderItems();
    }

    function clearForm() {
        document.getElementById('lootName').value = '';
        document.getElementById('lootImage').value = '';
        document.getElementById('lootPrice').value = '';
        tempItems = [];
        renderItems();
        editingIndex = -1;
        document.getElementById('lootFormTitle').innerText = 'НОВЫЙ ЛУТБОКС';
        document.getElementById('cancelLootBtn').style.display = 'none';
    }

    document.querySelectorAll('.editLootBtn').forEach(btn => {
        btn.onclick = () => {
            editingIndex = parseInt(btn.dataset.index);
            loadBox(lootboxes[editingIndex]);
            document.getElementById('lootFormTitle').innerText = 'РЕДАКТИРОВАНИЕ';
            document.getElementById('cancelLootBtn').style.display = 'inline-block';
        };
    });

    document.querySelectorAll('.deleteLootBtn').forEach(btn => {
        btn.onclick = async () => {
            const index = parseInt(btn.dataset.index);
            lootboxes.splice(index, 1);
            await updateLootboxes(lootboxes);
            log('ЛУТБОКС УДАЛЁН');
            renderLootboxAdmin();
        };
    });

    document.getElementById('cancelLootBtn').onclick = clearForm;

    document.getElementById('saveLootBtn').onclick = async () => {
        const name = document.getElementById('lootName').value.trim();
        const image = document.getElementById('lootImage').value.trim();
        const price = parseInt(document.getElementById('lootPrice').value);
        if (!name || isNaN(price) || tempItems.length === 0) {
            log('ОШИБКА: ЗАПОЛНИТЕ НАЗВАНИЕ, ЦЕНУ И ДОБАВЬТЕ ПРЕДМЕТ');
            return;
        }
        const box = { id: editingIndex >= 0 ? lootboxes[editingIndex].id : 'loot_' + Date.now(), name, image, price, items: tempItems };
        if (editingIndex >= 0) lootboxes[editingIndex] = box;
        else lootboxes.push(box);
        await updateLootboxes(lootboxes);
        log(`ЛУТБОКС "${name}" СОХРАНЁН`);
        clearForm();
        renderLootboxAdmin();
    };

    renderItems();
}