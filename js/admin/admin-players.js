// admin/admin-players.js
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from '../shared.js';
let foundUserId = null;
let foundUserData = null;

export function getFoundUserId() { return foundUserId; }
export function getFoundUserData() { return foundUserData; }

export async function findUserByLogin(login) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("login", "==", login));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

export function renderPlayersAdmin() {
    const inner = document.getElementById('adminPanelContent');
    if (!inner) return;

    inner.innerHTML = `
        <h3>УПРАВЛЕНИЕ ИГРОКАМИ</h3>
        
        <!-- Поиск игрока -->
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="text" id="searchLogin" placeholder="ЛОГИН ИГРОКА" style="flex:1;">
            <button id="searchBtn" style="flex:none; width:80px;">ПОИСК</button>
        </div>
        
        <!-- Информация о найденном игроке -->
        <div id="userInfoAdmin" style="margin-bottom:15px;"></div>
        
        <!-- Действия с игроком -->
        <div id="adminActions" class="hidden">
            <!-- Баланс -->
            <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; margin-bottom:10px;">
                <h4 style="margin:0 0 10px 0;">💎 БАЛАНС</h4>
                <div style="font-size:16px; margin-bottom:10px;" id="adminTokens">0 РК</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button id="addPinkBtn" style="font-size:10px; padding:6px 10px; flex:none;">+1 Р</button>
                    <button id="addGrayBtn" style="font-size:10px; padding:6px 10px; flex:none;">+1 С</button>
                    <button id="addYellowBtn" style="font-size:10px; padding:6px 10px; flex:none;">+1 Ж</button>
                    <button id="removePinkBtn" style="font-size:10px; padding:6px 10px; flex:none;">-1 Р</button>
                    <button id="removeGrayBtn" style="font-size:10px; padding:6px 10px; flex:none;">-1 С</button>
                    <button id="removeYellowBtn" style="font-size:10px; padding:6px 10px; flex:none;">-1 Ж</button>
                </div>
                <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
                    <input type="number" id="customTokens" placeholder="СУММА" style="width:80px; margin:0;">
                    <select id="customTokenType" style="width:60px; margin:0;">
                        <option value="pink">Р</option>
                        <option value="gray">С</option>
                        <option value="yellow">Ж</option>
                    </select>
                    <button id="setTokensBtn" style="flex:none; font-size:10px; padding:6px 10px;">УСТАНОВИТЬ</button>
                </div>
            </div>
            
            <!-- Инвентарь -->
            <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px;">
                <h4 style="margin:0 0 10px 0;">🎒 ИНВЕНТАРЬ</h4>
                <ul id="adminInventory" style="list-style:none; padding:0; max-height:200px; overflow-y:auto;"></ul>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <input type="text" id="newItemInput" placeholder="НАЗВАНИЕ ПРЕДМЕТА" style="flex:1;">
                    <button id="addItemBtn" style="flex:none; font-size:10px; padding:6px 10px;">ДОБАВИТЬ</button>
                </div>
            </div>
        </div>
    `;

    // Обработчики поиска
    document.getElementById('searchBtn').onclick = () => doSearch();
    document.getElementById('searchLogin').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });

    // Обработчики валюты
    document.getElementById('addPinkBtn').onclick = () => adjustTokens(1, 'pink');
    document.getElementById('addGrayBtn').onclick = () => adjustTokens(1, 'gray');
    document.getElementById('addYellowBtn').onclick = () => adjustTokens(1, 'yellow');
    document.getElementById('removePinkBtn').onclick = () => adjustTokens(-1, 'pink');
    document.getElementById('removeGrayBtn').onclick = () => adjustTokens(-1, 'gray');
    document.getElementById('removeYellowBtn').onclick = () => adjustTokens(-1, 'yellow');
    document.getElementById('setTokensBtn').onclick = () => setTokensValue();
    
    // Обработчик инвентаря
    document.getElementById('addItemBtn').onclick = () => addItemToInventory();
    document.getElementById('newItemInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItemToInventory();
    });
}

async function doSearch() {
    const login = document.getElementById('searchLogin').value.trim().toLowerCase();
    if (!login) {
        document.getElementById('userInfoAdmin').innerHTML = '<p style="color:#FF5555;">ВВЕДИТЕ ЛОГИН</p>';
        return;
    }
    
    const user = await findUserByLogin(login);
    if (!user) {
        document.getElementById('userInfoAdmin').innerHTML = '<p style="color:#FF5555;">ИГРОК НЕ НАЙДЕН</p>';
        document.getElementById('adminActions').classList.add('hidden');
        return;
    }
    
    foundUserId = user.id;
    foundUserData = user;
    
    document.getElementById('userInfoAdmin').innerHTML = `
        <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px;">
            <span style="color:var(--text-color);">НАЙДЕН: <strong>${user.login}</strong></span>
            ${user.characterIds ? `<span style="font-size:10px; opacity:0.6; margin-left:10px;">Персонажей: ${user.characterIds.length}</span>` : ''}
        </div>`;
    document.getElementById('adminActions').classList.remove('hidden');
    
    updateAdminDisplay(user);
}

function updateAdminDisplay(user) {
    const curs = user.currencies || { pink: 0, gray: 0, yellow: 0 };
    document.getElementById('adminTokens').innerHTML = `
        <span style="color:#FF88AA;">${curs.pink || 0} Р</span> · 
        <span style="color:#AAAAAA;">${curs.gray || 0} С</span> · 
        <span style="color:#FFAA00;">${curs.yellow || 0} Ж</span>`;
    
    const invList = document.getElementById('adminInventory');
    invList.innerHTML = '';
    const inventory = user.inventory || [];
    
    if (inventory.length === 0) {
        invList.innerHTML = '<li style="opacity:0.5; font-size:11px;">ИНВЕНТАРЬ ПУСТ</li>';
        return;
    }
    
    inventory.forEach((item, index) => {
        const li = document.createElement('li');
        const qty = item.quantity ? ` ×${item.quantity}` : '';
        const dur = item.durability !== undefined ? ` [${item.durability}%]` : '';
        
        li.style.cssText = 'padding:6px 0; border-bottom:1px solid var(--card-hover-bg); display:flex; justify-content:space-between; align-items:center; font-size:11px;';
        li.innerHTML = `
            <span>${item.image ? `<img src="${item.image}" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">` : ''}${item.name}${qty}${dur}</span>
            <button data-index="${index}" class="removeInvBtn" style="font-size:9px; padding:3px 8px; flex:none;">🗑️</button>`;
        invList.appendChild(li);
    });
    
    document.querySelectorAll('.removeInvBtn').forEach(btn => {
        btn.onclick = () => removeItemFromInventory(parseInt(btn.dataset.index));
    });
}

async function adjustTokens(delta, type = 'pink') {
    if (!foundUserId) return;
    
    const newCurrencies = { ...(foundUserData.currencies || { pink: 0, gray: 0, yellow: 0 }) };
    newCurrencies[type] = (newCurrencies[type] || 0) + delta;
    if (newCurrencies[type] < 0) newCurrencies[type] = 0;
    
    await updateDoc(doc(db, "users", foundUserId), { currencies: newCurrencies });
    foundUserData.currencies = newCurrencies; // обновляем локальный кэш
    updateAdminDisplay(foundUserData);
    
    const typeNames = { pink: 'РОЗОВЫХ', gray: 'СЕРЫХ', yellow: 'ЖЁЛТЫХ' };
    log(`БАЛАНС: ${delta > 0 ? '+' + delta : delta} ${typeNames[type]}`);
}

async function setTokensValue() {
    if (!foundUserId) return;
    
    const value = parseInt(document.getElementById('customTokens').value);
    const type = document.getElementById('customTokenType').value;
    
    if (isNaN(value) || value < 0) return;
    
    const newCurrencies = { ...(foundUserData.currencies || { pink: 0, gray: 0, yellow: 0 }) };
    newCurrencies[type] = value;
    
    await updateDoc(doc(db, "users", foundUserId), { currencies: newCurrencies });
    foundUserData.currencies = newCurrencies;
    updateAdminDisplay(foundUserData);
    
    log(`БАЛАНС УСТАНОВЛЕН: ${value} ${type === 'pink' ? 'Р' : type === 'gray' ? 'С' : 'Ж'}`);
}

async function addItemToInventory() {
    if (!foundUserId) return;
    
    const itemName = document.getElementById('newItemInput').value.trim();
    if (!itemName) return;
    
    const newInventory = [...(foundUserData.inventory || []), { name: itemName, quantity: 1 }];
    await updateDoc(doc(db, "users", foundUserId), { inventory: newInventory });
    foundUserData.inventory = newInventory;
    updateAdminDisplay(foundUserData);
    
    log(`ПРЕДМЕТ "${itemName}" ДОБАВЛЕН`);
    document.getElementById('newItemInput').value = '';
}

async function removeItemFromInventory(index) {
    if (!foundUserId) return;
    
    const newInventory = [...(foundUserData.inventory || [])];
    if (index >= 0 && index < newInventory.length) {
        const removed = newInventory.splice(index, 1)[0];
        await updateDoc(doc(db, "users", foundUserId), { inventory: newInventory });
        foundUserData.inventory = newInventory;
        updateAdminDisplay(foundUserData);
        
        log(`ПРЕДМЕТ "${removed.name}" УДАЛЁН`);
    }
}
