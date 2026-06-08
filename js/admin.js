// admin.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from './shared.js';
import { subscribeToShop, updateShopCategories } from './shop-config.js';
import { subscribeToLootboxes, updateLootboxes } from './lootbox-config.js';
import { renderGroupsAdmin, initGroups } from './groups.js';

// ⚠️ ЗАМЕНИ НА СВОЙ UID ИЗ КОНСОЛИ FIREBASE
const MASTER_UIDS = ["твой-uid-здесь"];

let currentUser = null;
onAuthStateChanged(auth, (user) => { currentUser = user; });

let foundUserId = null;
let foundUserData = null;
let shopCategories = {};
let lootboxesCache = [];
let adminMode = 'players';
let selectedCategory = null;
let selectedSubcategory = null;

export function isMaster(uid) {
    return MASTER_UIDS.includes(uid);
}

export function resetAdmin() {
    foundUserId = null;
    foundUserData = null;
    adminMode = 'players';
    selectedCategory = null;
    selectedSubcategory = null;
}

export async function findUserByLogin(login) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("login", "==", login));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

export async function renderAdmin() {
    const container = document.getElementById('adminContent');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">ЗАГРУЗКА...</p>';
        setTimeout(() => renderAdmin(), 100);
        return;
    }

    if (!isMaster(currentUser.uid)) {
        container.innerHTML = '<p style="color:#FF5555; text-align:center; padding:20px;">ДОСТУП ЗАКРЫТ. ТОЛЬКО ДЛЯ МАСТЕРА.</p>';
        return;
    }

    subscribeToShop((categories) => {
        shopCategories = categories;
        if (adminMode === 'shop') renderShopAdmin();
    });

    subscribeToLootboxes((boxes) => {
        lootboxesCache = boxes;
        if (adminMode === 'lootboxes') renderLootboxAdmin();
    });

    container.innerHTML = `
        <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap;">
            <button id="adminPlayersMode" style="${adminMode === 'players' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ИГРОКИ</button>
            <button id="adminShopMode" style="${adminMode === 'shop' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">МАГАЗИН</button>
            <button id="adminLootMode" style="${adminMode === 'lootboxes' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЛУТБОКСЫ</button>
            <button id="adminGroupsMode" style="${adminMode === 'groups' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ГРУППЫ</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('adminPlayersMode').onclick = () => { adminMode = 'players'; renderAdmin(); };
    document.getElementById('adminShopMode').onclick = () => { adminMode = 'shop'; selectedCategory = null; selectedSubcategory = null; renderAdmin(); };
    document.getElementById('adminLootMode').onclick = () => { adminMode = 'lootboxes'; renderAdmin(); };
    document.getElementById('adminGroupsMode').onclick = () => { adminMode = 'groups'; renderAdmin(); };

    if (adminMode === 'players') renderPlayersAdmin();
    else if (adminMode === 'shop') renderShopAdmin();
    else if (adminMode === 'lootboxes') renderLootboxAdmin();
    else if (adminMode === 'groups') {
        initGroups();
        renderGroupsAdmin('adminInnerContent');
    }
}

// ==================== ИГРОКИ ====================
function renderPlayersAdmin() {
    const inner = document.getElementById('adminInnerContent');
    inner.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="text" id="searchLogin" placeholder="ЛОГИН ИГРОКА" style="flex:1;">
            <button id="searchBtn">ПОИСК</button>
        </div>
        <div id="userInfoAdmin" style="margin-bottom:10px;"></div>
        <div id="adminActions" class="hidden">
            <h3>БАЛАНС: <span id="adminTokens">0</span> РК</h3>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button id="addTokensBtn">+1 РК</button>
                <button id="removeTokensBtn">-1 РК</button>
                <input type="number" id="customTokens" placeholder="СУММА" style="width:80px;">
                <button id="setTokensBtn">УСТАНОВИТЬ</button>
            </div>
            <h3>ИНВЕНТАРЬ:</h3>
            <ul id="adminInventory" style="list-style:none; padding:0;"></ul>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <input type="text" id="newItemInput" placeholder="НАЗВАНИЕ ПРЕДМЕТА" style="flex:1;">
                <button id="addItemBtn">ДОБАВИТЬ</button>
            </div>
        </div>
    `;
    document.getElementById('searchBtn').onclick = () => doSearch();
    document.getElementById('addTokensBtn').onclick = () => adjustTokens(1);
    document.getElementById('removeTokensBtn').onclick = () => adjustTokens(-1);
    document.getElementById('setTokensBtn').onclick = () => setTokensValue();
    document.getElementById('addItemBtn').onclick = () => addItemToInventory();
}

// ==================== МАГАЗИН ====================
function renderShopAdmin() {
    const inner = document.getElementById('adminInnerContent');

    if (!selectedCategory) {
        const catNames = Object.keys(shopCategories);
        let html = '<h3>КАТЕГОРИИ</h3><div style="display:flex; flex-direction:column; gap:6px;">';
        catNames.forEach(cat => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border:1px solid var(--border-color); cursor:pointer;" class="selectCatBtn" data-cat="${cat}">
                    <span>📁 ${cat}</span>
                    <button class="deleteCatBtn" data-cat="${cat}" style="font-size:10px; padding:4px 6px; flex:none;">УДАЛИТЬ</button>
                </div>`;
        });
        html += '</div>';
        html += `
            <div style="display:flex; gap:10px; margin-top:12px;">
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
                const newCat = { ...shopCategories };
                delete newCat[btn.dataset.cat];
                await updateShopCategories(newCat);
                log('КАТЕГОРИЯ УДАЛЕНА');
            };
        });
        document.getElementById('addCatBtn').onclick = async () => {
            const name = document.getElementById('newCatName').value.trim();
            if (!name || shopCategories[name]) return;
            const newCat = { ...shopCategories, [name]: { subcategories: {} } };
            await updateShopCategories(newCat);
            log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
        };
    } else if (!selectedSubcategory) {
        const subcats = shopCategories[selectedCategory]?.subcategories || {};
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
        html += `
            <div style="display:flex; gap:10px; margin-top:12px;">
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
                const newCat = { ...shopCategories };
                delete newCat[selectedCategory].subcategories[btn.dataset.sub];
                await updateShopCategories(newCat);
                log('ПОДКАТЕГОРИЯ УДАЛЕНА');
            };
        });
        document.getElementById('addSubBtn').onclick = async () => {
            const name = document.getElementById('newSubName').value.trim();
            if (!name || subcats[name]) return;
            const newCat = { ...shopCategories };
            newCat[selectedCategory].subcategories[name] = [];
            await updateShopCategories(newCat);
            log(`ПОДКАТЕГОРИЯ "${name}" СОЗДАНА`);
        };
    } else {
        const items = shopCategories[selectedCategory].subcategories[selectedSubcategory] || [];
        let html = `<button id="backToSub" style="margin-bottom:10px;">← К ПОДКАТЕГОРИЯМ</button>`;
        html += `<h3>${selectedCategory} → ${selectedSubcategory}</h3>`;
        html += '<div style="display:flex; flex-direction:column; gap:4px;">';
        items.forEach((item, index) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border:1px solid var(--border-color); font-size:11px;">
                    <span>${item.image ? `<img src="${item.image}" style="width:20px;height:20px;vertical-align:middle;"> ` : ''}${item.name} — ${item.price} РК</span>
                    <span style="font-size:9px; opacity:0.7;">${(item.tags || []).join(', ')}</span>
                    <button data-index="${index}" class="removeItemBtn">УДАЛИТЬ</button>
                </div>`;
        });
        html += '</div>';
        html += `
            <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                <input type="text" id="newItemName" placeholder="НАЗВАНИЕ" style="flex:1; min-width:120px;">
                <input type="text" id="newItemImage" placeholder="URL КАРТИНКИ" style="flex:1; min-width:120px;">
                <input type="number" id="newItemPrice" placeholder="ЦЕНА" style="width:70px;">
                <input type="text" id="newItemTags" placeholder="ТЕГИ (через запятую)" style="flex:1; min-width:120px;">
                <button id="addItemBtn">ДОБАВИТЬ</button>
            </div>`;
        inner.innerHTML = html;

        document.getElementById('backToSub').onclick = () => { selectedSubcategory = null; renderShopAdmin(); };
        document.querySelectorAll('.removeItemBtn').forEach(btn => {
            btn.onclick = async () => {
                const index = parseInt(btn.dataset.index);
                const newItems = [...items];
                newItems.splice(index, 1);
                const newCat = { ...shopCategories };
                newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
                await updateShopCategories(newCat);
                log('ТОВАР УДАЛЁН');
            };
        });
        document.getElementById('addItemBtn').onclick = async () => {
            const name = document.getElementById('newItemName').value.trim();
            const image = document.getElementById('newItemImage').value.trim();
            const price = parseInt(document.getElementById('newItemPrice').value);
            const tags = document.getElementById('newItemTags').value.split(',').map(t => t.trim()).filter(t => t);
            if (!name || isNaN(price)) return;
            const newItem = { id: Date.now().toString(), name, image, price, tags };
            const newItems = [...items, newItem];
            const newCat = { ...shopCategories };
            newCat[selectedCategory].subcategories[selectedSubcategory] = newItems;
            await updateShopCategories(newCat);
            log(`ТОВАР "${name}" ДОБАВЛЕН`);
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemImage').value = '';
            document.getElementById('newItemPrice').value = '';
            document.getElementById('newItemTags').value = '';
        };
    }
}

// ==================== ЛУТБОКСЫ ====================
function renderLootboxAdmin() {
    const inner = document.getElementById('adminInnerContent');
    const lootboxes = [...lootboxesCache];
    
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
            log('ОШИБКА: ЗАПОЛНИТЕ НАЗВАНИЕ, ЦЕНУ И ДОБАВЬТЕ ХОТЯ БЫ ОДИН ПРЕДМЕТ');
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
        renderLootboxAdmin();
    };

    renderItems();
}

// ==================== ФУНКЦИИ ИГРОКОВ ====================
async function doSearch() {
    const login = document.getElementById('searchLogin').value.trim().toLowerCase();
    if (!login) return;
    const user = await findUserByLogin(login);
    if (!user) {
        document.getElementById('userInfoAdmin').innerHTML = '<p style="color:#FF5555;">ИГРОК НЕ НАЙДЕН</p>';
        document.getElementById('adminActions').classList.add('hidden');
        return;
    }
    foundUserId = user.id;
    foundUserData = user;
    document.getElementById('userInfoAdmin').innerHTML = `<p>НАЙДЕН: ${user.login}</p>`;
    document.getElementById('adminActions').classList.remove('hidden');
    updateAdminDisplay(user);
}

function updateAdminDisplay(user) {
    document.getElementById('adminTokens').innerText = user.tokens || 0;
    const invList = document.getElementById('adminInventory');
    invList.innerHTML = '';
    const inventory = user.inventory || [];
    inventory.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = 'padding:5px 0; border-bottom:1px solid var(--card-hover-bg); display:flex; justify-content:space-between; font-size:12px;';
        li.innerHTML = `<span>${typeof item === 'string' ? item : item.name}</span> <button data-index="${index}" class="removeInvBtn" style="font-size:9px; padding:2px 6px; flex:none;">УДАЛИТЬ</button>`;
        invList.appendChild(li);
    });
    document.querySelectorAll('.removeInvBtn').forEach(btn => {
        btn.onclick = () => removeItemFromInventory(parseInt(btn.dataset.index));
    });
}

async function adjustTokens(delta) {
    if (!foundUserId) return;
    const newTokens = (foundUserData.tokens || 0) + delta;
    await updateDoc(doc(db, "users", foundUserId), { tokens: newTokens });
    log(`БАЛАНС ИГРОКА ИЗМЕНЁН НА ${delta > 0 ? '+' + delta : delta} РК`);
}

async function setTokensValue() {
    if (!foundUserId) return;
    const value = parseInt(document.getElementById('customTokens').value);
    if (isNaN(value)) return;
    await updateDoc(doc(db, "users", foundUserId), { tokens: value });
    log(`БАЛАНС УСТАНОВЛЕН В ${value} РК`);
}

async function addItemToInventory() {
    if (!foundUserId) return;
    const itemName = document.getElementById('newItemInput').value.trim();
    if (!itemName) return;
    const newInventory = [...(foundUserData.inventory || []), itemName];
    await updateDoc(doc(db, "users", foundUserId), { inventory: newInventory });
    log(`ПРЕДМЕТ "${itemName}" ДОБАВЛЕН`);
    document.getElementById('newItemInput').value = '';
}

async function removeItemFromInventory(index) {
    if (!foundUserId) return;
    const newInventory = [...(foundUserData.inventory || [])];
    if (index >= 0 && index < newInventory.length) {
        const removed = newInventory.splice(index, 1);
        await updateDoc(doc(db, "users", foundUserId), { inventory: newInventory });
        log(`ПРЕДМЕТ "${removed[0]}" УДАЛЁН`);
    }
}
