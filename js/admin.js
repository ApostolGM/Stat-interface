// В admin.js, замени renderLootboxAdmin:

function renderLootboxAdmin() {
    const inner = document.getElementById('adminInnerContent');
    const boxes = JSON.parse(localStorage.getItem('lootboxes_cache') || '[]');
    
    let html = '<h3>КОНСТРУКТОР ЛУТБОКСОВ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">';
    
    shopCategories._lootboxes = shopCategories._lootboxes || boxes;
    const lootboxes = shopCategories._lootboxes;
    
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
    html += '</div>';
    
    // Форма создания/редактирования
    html += `
        <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:12px;">
            <h4 id="lootFormTitle">НОВЫЙ ЛУТБОКС</h4>
            <input type="text" id="lootName" placeholder="НАЗВАНИЕ">
            <input type="text" id="lootImage" placeholder="URL КАРТИНКИ (необяз.)">
            <input type="number" id="lootPrice" placeholder="ЦЕНА В РК">
            <h4>ПРЕДМЕТЫ (имя | картинка | шанс)</h4>
            <div id="lootItemsList" style="display:flex; flex-direction:column; gap:4px; max-height:150px; overflow-y:auto;"></div>
            <div style="display:flex; gap:5px; margin-top:5px;">
                <input type="text" id="newItemName" placeholder="Название" style="flex:1;">
                <input type="text" id="newItemImage" placeholder="URL" style="width:80px;">
                <input type="number" id="newItemChance" placeholder="Шанс" style="width:60px;" value="10">
                <button id="addLootItemBtn">+</button>
            </div>
            <button id="saveLootBtn" style="margin-top:10px;">СОХРАНИТЬ</button>
            <button id="cancelLootBtn" style="margin-top:5px; display:none;">ОТМЕНА</button>
        </div>`;
    inner.innerHTML = html;

    let editingIndex = -1;
    let tempItems = [];

    function renderItems() {
        const list = document.getElementById('lootItemsList');
        if (!list) return;
        list.innerHTML = '';
        tempItems.forEach((item, i) => {
            list.innerHTML += `
                <div style="display:flex; gap:4px; align-items:center; font-size:10px;">
                    <span style="flex:1;">${item.name}</span>
                    <span style="width:50px;">шанс: ${item.chance}</span>
                    <button data-i="${i}" class="removeLootItemBtn">×</button>
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
        const name = document.getElementById('newItemName').value.trim();
        const image = document.getElementById('newItemImage').value.trim();
        const chance = parseInt(document.getElementById('newItemChance').value);
        if (!name || isNaN(chance)) return;
        tempItems.push({ name, image, chance });
        document.getElementById('newItemName').value = '';
        document.getElementById('newItemImage').value = '';
        document.getElementById('newItemChance').value = '10';
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
        if (!name || isNaN(price) || tempItems.length === 0) return;

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
        renderLootboxAdmin();
    };

    renderItems();
}
