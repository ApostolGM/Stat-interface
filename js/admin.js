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

export async function findUserByEmail(email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
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

// ========== РЕЖИМ ИГРОКОВ (без изменений) ==========
function renderPlayersAdmin() {
    const inner = document.getElementById('adminInnerContent');
    inner.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="email" id="searchEmail" placeholder="EMAIL ИГРОКА" style="flex:1;">
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

// ========== РЕЖИМ МАГАЗИНА (с категориями) ==========
function renderShopAdmin() {
    const inner = document.getElementById('adminInnerContent');

    if (!selectedCategory) {
        // Показываем список категорий
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
        // Показываем товары выбранной категории
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

// ========== ФУНКЦИИ ИГРОКОВ (без изменений) ==========
async function doSearch() { /* ... */ }
function updateAdminDisplay(user) { /* ... */ }
async function adjustTokens(delta) { /* ... */ }
async function setTokensValue() { /* ... */ }
async function addItemToInventory() { /* ... */ }
async function removeItemFromInventory(index) { /* ... */ }
