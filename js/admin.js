// admin.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from './shared.js';
import { subscribeToShop, updateShopCategories } from './shop-config.js';

const MASTER_PASSWORD = "gephard217";

let isAdminUnlocked = false;
let foundUserId = null;
let foundUserData = null;
let shopCategories = {};
let adminMode = 'players'; // 'players', 'shop', 'lootboxes'
let selectedCategory = null;
let selectedSubcategory = null;

export function checkMasterPassword(password) {
    if (password === MASTER_PASSWORD) {
        isAdminUnlocked = true;
        return true;
    }
    return false;
}

export function resetAdmin() {
    isAdminUnlocked = false;
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
    if (!isAdminUnlocked) {
        container.innerHTML = `
            <p>ВВЕДИТЕ МАСТЕР-ПАРОЛЬ:</p>
            <input type="password" id="masterPasswordInput" placeholder="ПАРОЛЬ">
            <button id="submitMasterPassword">ПОДТВЕРДИТЬ</button>
            <p id="adminError" style="color:#FF5555;"></p>
        `;
        document.getElementById('submitMasterPassword').onclick = () => {
            const pwd = document.getElementById('masterPasswordInput').value;
            if (checkMasterPassword(pwd)) {
                log('ДОСТУП РАЗРЕШЁН. ДОБРО ПОЖАЛОВАТЬ, МАСТЕР.');
                renderAdmin();
            } else {
                document.getElementById('adminError').innerText = 'НЕВЕРНЫЙ ПАРОЛЬ';
            }
        };
        return;
    }

    subscribeToShop((categories) => {
        shopCategories = categories;
        if (adminMode === 'shop') renderShopAdmin();
        if (adminMode === 'lootboxes') renderLootboxAdmin();
    });

    container.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <button id="adminPlayersMode" style="${adminMode === 'players' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ИГРОКИ</button>
            <button id="adminShopMode" style="${adminMode === 'shop' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">МАГАЗИН</button>
            <button id="adminLootMode" style="${adminMode === 'lootboxes' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЛУТБОКСЫ</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('adminPlayersMode').onclick = () => { adminMode = 'players'; renderAdmin(); };
    document.getElementById('adminShopMode').onclick = () => { adminMode = 'shop'; selectedCategory = null; selectedSubcategory = null; renderAdmin(); };
    document.getElementById('adminLootMode').onclick = () => { adminMode = 'lootboxes'; renderAdmin(); };

    if (adminMode === 'players') renderPlayersAdmin();
    else if (adminMode === 'shop') renderShopAdmin();
    else if (adminMode === 'lootboxes') renderLootboxAdmin();
}

// ========== ИГРОКИ (без изменений, но валюта РК) ==========
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

// ========== МАГАЗИН (с подкатегориями) ==========
function renderShopAdmin() {
    const inner = document.getElementById('adminInnerContent');

    if (!selectedCategory) {
        // Список категорий
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
        // Список подкатегорий
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
        // Список товаров в подкатегории
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

// ========== ЛУТБОКСЫ (заглушка — будет в следующем этапе) ==========
function renderLootboxAdmin() {
    document.getElementById('adminInnerContent').innerHTML = `
        <p>КОНСТРУКТОР ЛУТБОКСОВ БУДЕТ ДОБАВЛЕН В СЛЕДУЮЩЕМ ОБНОВЛЕНИИ</p>
    `;
}

// ========== ФУНКЦИИ ИГРОКОВ ==========
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
        li.style.cssText = 'padding:5px 0; border-bottom:1px solid var(--card-hover-bg); display:flex; justify-content:space-between;';
        li.innerHTML = `<span>${item}</span> <button data-index="${index}" class="removeInvBtn">УДАЛИТЬ</button>`;
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
