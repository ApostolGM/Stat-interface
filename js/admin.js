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
let adminMode = 'players'; // 'players' или 'shop'
let selectedCategory = null;

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
    });

    container.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <button id="adminPlayersMode" style="${adminMode === 'players' ? 'background:#20C20E;color:#000;' : ''}">ИГРОКИ</button>
            <button id="adminShopMode" style="${adminMode === 'shop' ? 'background:#20C20E;color:#000;' : ''}">МАГАЗИН</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('adminPlayersMode').onclick = () => { adminMode = 'players'; renderAdmin(); };
    document.getElementById('adminShopMode').onclick = () => { adminMode = 'shop'; selectedCategory = null; renderAdmin(); };

    if (adminMode === 'players') renderPlayersAdmin();
    else renderShopAdmin();
}

// ========== РЕЖИМ ИГРОКОВ ==========
function renderPlayersAdmin() {
    const inner = document.getElementById('adminInnerContent');
    inner.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="text" id="searchLogin" placeholder="ЛОГИН ИГРОКА" style="flex:1;">
            <button id="searchBtn">ПОИСК</button>
        </div>
        <div id="userInfoAdmin" style="margin-bottom:10px;"></div>
        <div id="adminActions" class="hidden">
            <h3>БАЛАНС: <span id="adminTokens">0</span> ЖЕТОНОВ</h3>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button id="addTokensBtn">+1 ЖЕТОН</button>
                <button id="removeTokensBtn">-1 ЖЕТОН</button>
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

// ========== РЕЖИМ МАГАЗИНА ==========
function renderShopAdmin() {
    const inner = document.getElementById('adminInnerContent');

    if (!selectedCategory) {
        const catNames = Object.keys(shopCategories);
        let html = '<h3>КАТЕГОРИИ МАГАЗИНА</h3>';
        html += '<div style="display:flex; flex-direction:column; gap:8px;">';
        catNames.forEach(cat => {
            const itemCount = shopCategories[cat] ? shopCategories[cat].length : 0;
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#0b1a0b; padding:10px; border:1px solid #20C20E; cursor:pointer;" class="selectCategoryBtn" data-cat="${cat}">
                    <span>📁 ${cat} (${itemCount} товаров)</span>
                    <button class="deleteCategoryBtn" data-cat="${cat}" style="font-size:12px; padding:4px 8px; flex:none;">УДАЛИТЬ</button>
                </div>`;
        });
        html += '</div>';
        html += `
            <div style="display:flex; gap:10px; margin-top:15px;">
                <input type="text" id="newCategoryName" placeholder="НАЗВАНИЕ КАТЕГОРИИ" style="flex:1;">
                <button id="addCategoryBtn">СОЗДАТЬ</button>
            </div>`;
        inner.innerHTML = html;

        document.querySelectorAll('.selectCategoryBtn').forEach(div => {
            div.onclick = (e) => {
                if (e.target.classList.contains('deleteCategoryBtn')) return;
                selectedCategory = div.dataset.cat;
                renderShopAdmin();
            };
        });
        document.querySelectorAll('.deleteCategoryBtn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const cat = btn.dataset.cat;
                const newCategories = { ...shopCategories };
                delete newCategories[cat];
                await updateShopCategories(newCategories);
                log(`КАТЕГОРИЯ "${cat}" УДАЛЕНА`);
            };
        });
        document.getElementById('addCategoryBtn').onclick = async () => {
            const name = document.getElementById('newCategoryName').value.trim();
            if (!name || shopCategories[name]) return;
            const newCategories = { ...shopCategories, [name]: [] };
            await updateShopCategories(newCategories);
            log(`КАТЕГОРИЯ "${name}" СОЗДАНА`);
            document.getElementById('newCategoryName').value = '';
        };
    } else {
        const items = shopCategories[selectedCategory] || [];
        let html = `<button id="backToCategories" style="margin-bottom:10px;">← НАЗАД К КАТЕГОРИЯМ</button>`;
        html += `<h3>КАТЕГОРИЯ: ${selectedCategory}</h3>`;
        html += '<div style="display:flex; flex-direction:column; gap:5px;">';
        items.forEach((item, index) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#0b1a0b; padding:8px; border:1px solid #20C20E;">
                    <span>${item.emoji} ${item.name} — ${item.price} жет.</span>
                    <button data-index="${index}" class="removeItemBtn">УДАЛИТЬ</button>
                </div>`;
        });
        html += '</div>';
        html += `
            <div style="display:flex; gap:10px; margin-top:15px;">
                <input type="text" id="newItemName" placeholder="НАЗВАНИЕ" style="flex:1;">
                <input type="text" id="newItemEmoji" placeholder="ЭМОДЗИ" style="width:60px;">
                <input type="number" id="newItemPrice" placeholder="ЦЕНА" style="width:70px;">
                <button id="addItemBtn">ДОБАВИТЬ</button>
            </div>`;
        inner.innerHTML = html;

        document.getElementById('backToCategories').onclick = () => {
            selectedCategory = null;
            renderShopAdmin();
        };
        document.querySelectorAll('.removeItemBtn').forEach(btn => {
            btn.onclick = async () => {
                const index = parseInt(btn.dataset.index);
                const newItems = [...items];
                newItems.splice(index, 1);
                const newCategories = { ...shopCategories, [selectedCategory]: newItems };
                await updateShopCategories(newCategories);
                log('ТОВАР УДАЛЁН');
            };
        });
        document.getElementById('addItemBtn').onclick = async () => {
            const name = document.getElementById('newItemName').value.trim();
            const emoji = document.getElementById('newItemEmoji').value.trim();
            const price = parseInt(document.getElementById('newItemPrice').value);
            if (!name || !emoji || isNaN(price)) return;
            const newItem = { id: Date.now().toString(), name, emoji, price };
            const newItems = [...items, newItem];
            const newCategories = { ...shopCategories, [selectedCategory]: newItems };
            await updateShopCategories(newCategories);
            log(`ТОВАР "${name}" ДОБАВЛЕН`);
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemEmoji').value = '';
            document.getElementById('newItemPrice').value = '';
        };
    }
}

// ========== ФУНКЦИИ УПРАВЛЕНИЯ ИГРОКАМИ ==========
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
    document.getElementById('userInfoAdmin').innerHTML = `<p>НАЙДЕН: ${user.login || user.email}</p>`;
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
        li.style.cssText = 'padding:5px 0; border-bottom:1px solid #1a3a1a; display:flex; justify-content:space-between;';
        li.innerHTML = `<span>${item}</span> <button data-index="${index}" class="removeItemBtn">УДАЛИТЬ</button>`;
        invList.appendChild(li);
    });
    document.querySelectorAll('.removeItemBtn').forEach(btn => {
        btn.onclick = () => removeItemFromInventory(parseInt(btn.dataset.index));
    });
}

async function adjustTokens(delta) {
    if (!foundUserId) return;
    const newTokens = (foundUserData.tokens || 0) + delta;
    await updateDoc(doc(db, "users", foundUserId), { tokens: newTokens });
    log(`ЖЕТОНЫ ИГРОКА ИЗМЕНЕНЫ НА ${delta > 0 ? '+' + delta : delta}`);
}

async function setTokensValue() {
    if (!foundUserId) return;
    const value = parseInt(document.getElementById('customTokens').value);
    if (isNaN(value)) return;
    await updateDoc(doc(db, "users", foundUserId), { tokens: value });
    log(`БАЛАНС УСТАНОВЛЕН В ${value} ЖЕТОНОВ`);
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
