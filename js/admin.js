// admin.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from './ui.js';

const MASTER_PASSWORD = "gephard217"; // ← ЗАДАЙ СВОЙ ПАРОЛЬ

let isAdminUnlocked = false;
let foundUserId = null;
let foundUserData = null;

// Проверка пароля
export function checkMasterPassword(password) {
    if (password === MASTER_PASSWORD) {
        isAdminUnlocked = true;
        return true;
    }
    return false;
}

// Сброс админ-доступа при выходе
export function resetAdmin() {
    isAdminUnlocked = false;
    foundUserId = null;
    foundUserData = null;
}

// Поиск пользователя по email
export async function findUserByEmail(email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email)); // нужно поле email в документах
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

// Рендер админ-интерфейса
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

    // Админ-интерфейс
    container.innerHTML = `
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

    // Обработчики
    document.getElementById('searchBtn').onclick = () => doSearch();
    document.getElementById('addTokensBtn').onclick = () => adjustTokens(1);
    document.getElementById('removeTokensBtn').onclick = () => adjustTokens(-1);
    document.getElementById('setTokensBtn').onclick = () => setTokensValue();
    document.getElementById('addItemBtn').onclick = () => addItemToInventory();
}

async function doSearch() {
    const email = document.getElementById('searchEmail').value.trim();
    if (!email) return;
    const user = await findUserByEmail(email);
    if (!user) {
        document.getElementById('userInfoAdmin').innerHTML = '<p style="color:#FF5555;">ИГРОК НЕ НАЙДЕН</p>';
        document.getElementById('adminActions').classList.add('hidden');
        return;
    }
    foundUserId = user.id;
    foundUserData = user;
    document.getElementById('userInfoAdmin').innerHTML = `<p>НАЙДЕН: ${user.email}</p>`;
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
