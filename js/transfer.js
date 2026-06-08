import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getCurrencies, getInventory } from './state.js';
import { log } from './shared.js';
import { subscribeToGroups } from './groups-config.js';
import { currentUser } from './auth.js';

let currentChar = null;

export function renderTransfer() {
    const container = document.getElementById('transferContent');
    if (!container || container.classList.contains('hidden')) return;
    currentChar = window.selectedCharacter;
    if (!currentChar || !currentChar.groupId) {
        container.innerHTML = '<p>ВЫ НЕ В ГРУППЕ</p>';
        return;
    }
    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === currentChar.groupId);
        if (!group) { container.innerHTML = '<p>ГРУППА НЕ НАЙДЕНА</p>'; return; }
        renderTransferUI(container, group);
    });
}

function renderTransferUI(container, group) {
    const inventory = getInventory();
    const currencies = getCurrencies();
    let html = '<h3>ПЕРЕДАЧА</h3>';
    html += '<select id="transferTarget"><option value="">ВЫБЕРИТЕ ПЕРСОНАЖА</option>';
    group.players.forEach(id => { if (id !== currentChar.id) html += `<option value="${id}">${id}</option>`; });
    html += '</select>';
    // предметы
    html += '<h4>ПРЕДМЕТЫ</h4><div id="transferItems" style="max-height:150px; overflow-y:auto; margin-bottom:10px;">';
    inventory.forEach((item, i) => {
        html += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--card-hover-bg);">
            <span>${item.name} x${item.quantity || 1}</span>
            <input type="number" id="qty_${i}" value="1" min="1" max="${item.quantity || 1}" style="width:60px; margin:0;">
            <button data-index="${i}" class="transferItemBtn">ПЕРЕДАТЬ</button>
        </div>`;
    });
    html += '</div>';
    // валюта
    html += `<div>Р: ${currencies.pink || 0} С: ${currencies.gray || 0} Ж: ${currencies.yellow || 0}</div>
        <input type="number" id="transferPink" placeholder="Р" style="width:60px;">
        <input type="number" id="transferGray" placeholder="С" style="width:60px;">
        <input type="number" id="transferYellow" placeholder="Ж" style="width:60px;">
        <button id="transferCurrencyBtn">ПЕРЕДАТЬ</button>`;
    container.innerHTML = html;

    document.querySelectorAll('.transferItemBtn').forEach(btn => {
        btn.onclick = () => transferItem(parseInt(btn.dataset.index));
    });
    document.getElementById('transferCurrencyBtn').onclick = () => transferCurrency();
}

async function transferItem(index) {
    const targetId = document.getElementById('transferTarget').value;
    if (!targetId) { log('ВЫБЕРИТЕ ПОЛУЧАТЕЛЯ'); return; }
    const qty = parseInt(document.getElementById(`qty_${index}`).value) || 1;
    const inventory = getInventory();
    const item = inventory[index];
    if (!item || qty > (item.quantity || 1)) return;
    const targetDoc = await getDoc(doc(db, "characters", targetId));
    if (!targetDoc.exists()) return;
    const targetData = targetDoc.data();
    const targetInventory = targetData.inventory || [];
    const existing = targetInventory.find(i => i.itemId === item.itemId);
    if (existing) existing.quantity = (existing.quantity || 1) + qty;
    else targetInventory.push({ ...item, quantity: qty });
    if (item.quantity <= qty) inventory.splice(index, 1);
    else item.quantity -= qty;
    await updateDoc(doc(db, "characters", targetId), { inventory: targetInventory });
    await updateDoc(doc(db, "characters", currentChar.id), { inventory: [...inventory] });
    log(`ПЕРЕДАНО: ${item.name} x${qty}`);
    renderTransfer();
}

async function transferCurrency() {
    const targetCharId = document.getElementById('transferTarget').value;
    if (!targetCharId) { log('ВЫБЕРИТЕ ПОЛУЧАТЕЛЯ'); return; }
    const pink = parseInt(document.getElementById('transferPink').value) || 0;
    const gray = parseInt(document.getElementById('transferGray').value) || 0;
    const yellow = parseInt(document.getElementById('transferYellow').value) || 0;
    if (pink === 0 && gray === 0 && yellow === 0) return;
    const currencies = getCurrencies();
    if (pink > (currencies.pink || 0) || gray > (currencies.gray || 0) || yellow > (currencies.yellow || 0)) {
        log('НЕДОСТАТОЧНО КРИСТАЛЛОВ');
        return;
    }
    const targetChar = await getDoc(doc(db, "characters", targetCharId));
    if (!targetChar.exists()) return;
    const targetUserId = targetChar.data().userId;
    const targetUser = await getDoc(doc(db, "users", targetUserId));
    if (!targetUser.exists()) return;
    const targetCurrencies = targetUser.data().currencies || { pink: 0, gray: 0, yellow: 0 };
    const newSender = { pink: currencies.pink - pink, gray: currencies.gray - gray, yellow: currencies.yellow - yellow };
    await updateDoc(doc(db, "users", currentUser.uid), { currencies: newSender });
    const newTarget = { pink: (targetCurrencies.pink || 0) + pink, gray: (targetCurrencies.gray || 0) + gray, yellow: (targetCurrencies.yellow || 0) + yellow };
    await updateDoc(doc(db, "users", targetUserId), { currencies: newTarget });
    log(`ПЕРЕДАНО: ${pink}Р ${gray}С ${yellow}Ж`);
    renderTransfer();
}