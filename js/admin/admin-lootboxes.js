// admin/admin-lootboxes.js
import { log } from '../shared.js';
import { updateLootboxes } from '../lootbox-config.js';
import { getLootboxesCache } from './admin-main.js';
import { subscribeToItems } from '../items-config.js';

export function renderLootboxAdmin() {
    const inner = document.getElementById('adminPanelContent');
    if (!inner) return;

    const lootboxes = [...getLootboxesCache()];
    let allItems = [];
    
    // Подписываемся на библиотеку предметов один раз
    subscribeToItems(items => {
        allItems = items;
        renderUI();
    });

    function renderUI() {
        let html = '<h3>КОНСТРУКТОР ЛУТБОКСОВ</h3>';
        
        // Список существующих лутбоксов
        html += '<div style="display:flex; flex-direction:column; gap:8px; max-height:250px; overflow-y:auto; margin-bottom:15px;">';
        if (lootboxes.length === 0) {
            html += '<p style="opacity:0.6;">НЕТ СОЗДАННЫХ ЛУТБОКСОВ</p>';
        } else {
            lootboxes.forEach((box, index) => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border:1px solid var(--border-color);">
                        <span style="display:flex; align-items:center; gap:8px;">
                            ${box.image ? `<img src="${box.image}" style="width:24px;height:24px;">` : '📦'}
                            <span>${box.name} — ${box.price} РК (${box.items.length} предм.)</span>
                        </span>
                        <div style="display:flex; gap:5px;">
                            <button data-index="${index}" class="editLootBtn" style="font-size:10px; padding:4px 8px; flex:none;">✏️</button>
                            <button data-index="${index}" class="deleteLootBtn" style="font-size:10px; padding:4px 8px; flex:none;">🗑️</button>
                        </div>
                    </div>`;
            });
        }
        html += '</div>';

        // Форма создания/редактирования
        html += `
            <div style="border-top:1px solid var(--border-color); padding-top:15px;">
                <h4 id="lootFormTitle">НОВЫЙ ЛУТБОКС</h4>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <input type="text" id="lootName" placeholder="НАЗВАНИЕ" style="flex:1;">
                    <div style="display:flex; gap:4px; align-items:center; flex:1;">
                        <input type="text" id="lootImage" placeholder="URL или BASE64" style="flex:1;">
                        <input type="file" id="lootImageFile" accept="image/*" style="display:none;">
                        <button id="uploadLootImageBtn" style="font-size:14px; padding:8px 10px; flex:none;" title="ЗАГРУЗИТЬ">📁</button>
                    </div>
                    <input type="number" id="lootPrice" placeholder="ЦЕНА В РК" style="width:100px;">
                </div>
                
                <h4>ПРЕДМЕТЫ (выбор из библиотеки | шанс)</h4>
                <div id="lootItemsList" style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto; margin-bottom:10px;"></div>
                
                <div style="display:flex; gap:5px; margin-bottom:10px;">
                    <select id="newLootItemSelect" style="flex:1;">
                        <option value="">ВЫБЕРИТЕ ПРЕДМЕТ</option>
                        ${allItems.map(item => `<option value="${item.id}">${item.name} (база: ${item.basePrice} РК)</option>`).join('')}
                    </select>
                    <input type="number" id="newLootItemChance" placeholder="ШАНС" style="width:70px;" value="10" min="1">
                    <button id="addLootItemBtn" style="flex:none;">+</button>
                </div>
                
                <div style="display:flex; gap:8px;">
                    <button id="saveLootBtn">СОХРАНИТЬ</button>
                    <button id="cancelLootBtn" style="display:none;">ОТМЕНА</button>
                </div>
            </div>`;
        inner.innerHTML = html;

        // ========== ПЕРЕМЕННЫЕ ФОРМЫ ==========
        let editingIndex = -1;
        let tempItems = [];

        // ========== ФУНКЦИИ ==========
        function renderItems() {
            const list = document.getElementById('lootItemsList');
            if (!list) return;
            list.innerHTML = '';
            if (tempItems.length === 0) {
                list.innerHTML = '<p style="font-size:10px; opacity:0.6;">НЕТ ПРЕДМЕТОВ</p>';
                return;
            }
            tempItems.forEach((item, i) => {
                const libItem = allItems.find(ai => ai.id === item.itemId);
                const name = libItem ? libItem.name : item.itemId;
                const img = libItem?.image ? `<img src="${libItem.image}" style="width:16px;height:16px;">` : '';
                list.innerHTML += `
                    <div style="display:flex; gap:6px; align-items:center; font-size:10px; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color);">
                        ${img}
                        <span style="flex:1;">${name}</span>
                        <span style="width:60px; text-align:right;">шанс: ${item.chance}</span>
                        <button data-i="${i}" class="removeLootItemBtn" style="font-size:10px; padding:2px 6px; flex:none;">×</button>
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
            const itemId = document.getElementById('newLootItemSelect').value;
            const chance = parseInt(document.getElementById('newLootItemChance').value);
            if (!itemId || isNaN(chance) || chance <= 0) return;
            tempItems.push({ itemId, chance });
            document.getElementById('newLootItemSelect').value = '';
            document.getElementById('newLootItemChance').value = '10';
            renderItems();
        };

        function loadBox(box) {
            document.getElementById('lootName').value = box.name;
            document.getElementById('lootImage').value = box.image || '';
            document.getElementById('lootPrice').value = box.price;
            tempItems = JSON.parse(JSON.stringify(box.items || []));
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

        // Загрузка картинки
        document.getElementById('uploadLootImageBtn').onclick = () => document.getElementById('lootImageFile').click();
        document.getElementById('lootImageFile').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 500 * 1024) {
                log('ОШИБКА: ФАЙЛ СЛИШКОМ БОЛЬШОЙ (МАКС 500 КБ)');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => document.getElementById('lootImage').value = ev.target.result;
            reader.readAsDataURL(file);
        };

        // Редактирование и удаление
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
                renderUI();
            };
        });

        document.getElementById('cancelLootBtn').onclick = clearForm;

        document.getElementById('saveLootBtn').onclick = async () => {
            const name = document.getElementById('lootName').value.trim();
            const image = document.getElementById('lootImage').value.trim();
            const price = parseInt(document.getElementById('lootPrice').value);
            if (!name || isNaN(price) || tempItems.length === 0) {
                log('ОШИБКА: ЗАПОЛНИТЕ НАЗВАНИЕ, ЦЕНУ И ДОБАВЬТЕ ПРЕДМЕТЫ');
                return;
            }

            const box = {
                id: editingIndex >= 0 ? lootboxes[editingIndex].id : 'loot_' + Date.now(),
                name,
                image,
                price,
                items: tempItems
            };

            if (editingIndex >= 0) {
                lootboxes[editingIndex] = box;
            } else {
                lootboxes.push(box);
            }

            await updateLootboxes(lootboxes);
            log(`ЛУТБОКС "${name}" СОХРАНЁН`);
            clearForm();
            renderUI();
        };

        renderItems();
    }
}
