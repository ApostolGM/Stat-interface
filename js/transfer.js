// transfer.js
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

    container.innerHTML = '<p>ЗАГРУЗКА...</p>';

    subscribeToGroups(groups => {
        const group = groups.find(g => g.id === currentChar.groupId);
        if (!group) {
            container.innerHTML = '<p>ГРУППА НЕ НАЙДЕНА</p>';
            return;
        }
        renderTransferUI(container, group);
    });
}

function renderTransferUI(container, group) {
    const inventory = getInventory();
    const currencies = getCurrencies();

    let html = '<h3>ПЕРЕДАЧА</h3>';

    // Выбор получателя (персонаж)
    html += '<select id="transferTarget" style="margin-bottom:10px;">';
    html += '<option value="">ВЫБЕРИТЕ ПЕРСОНАЖА</option>';
    group.players.forEach(charId => {
        if (charId !== currentChar.id) {
            html += `<option value="${charId}">${charId}</option>`;
        }
    });
    html += '</select>';

    // Предметы
    html += '<h4>ПРЕДМЕТЫ</h4><div id="transferItems" style="max-height:150px; overflow-y:auto; margin-bottom:10px;">';
    if (inventory.length === 0) {
        html += '<p>ИНВЕНТАРЬ ПУСТ</p>';
    } else {
        inventory.forEach((item, i) => {
            html += `
                <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--card-hover-bg);">
                    <span>${item.name} x${item.quantity || 1}</span>
                    <input type="number" id="qty_${i}" value="1" min="1" max="${item.quantity || 1}" style="width:60px; margin:0;">
                    <button data-index="${i}" class="transferItemBtn">ПЕРЕДАТЬ</button>
                </div>`;
        });
    }
    html += '</div>';

    // Валюта
    html += '<h4>КРИСТАЛЛЫ</h4>';
    html += `<div style="display:flex; gap:8px; margin-bottom:10px;">
        <span>Р: ${currencies.pink || 0}</span>
        <span>С: ${currencies.gray || 0}</span>
        <span>Ж: ${currencies.yellow || 0}</span>
    </div>`;
    html += '<div style="display:flex; gap:5px; margin-bottom:10px;">';
    html += '<input type="number" id="transferPink" placeholder="Р" style="flex:1;" min="0">';
    html += '<input type="number" id="transferGray" placeholder="С" style="flex:1;" min="0">';
    html += '<input type="number" id="transferYellow" placeholder="Ж" style="flex:1;" min="0">';
    html += '<button id="transferCurrencyBtn">ПЕРЕДАТЬ</button>';
    html += '</div>';

    container.innerHTML = html;

    // Обработчики передачи предметов
    document.querySelectorAll('.transferItemBtn').forEach(btn => {
        btn.onclick = () => transferItem(parseInt(btn.dataset.index));
    });

    // Передача валюты
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
    if (!targetDoc.exists()) { log('ПОЛУЧАТЕЛЬ НЕ НАЙДЕН'); return; }
    const targetData = targetDoc.data();
    const targetInventory = targetData.inventory || [];

    const existing = targetInventory.find(i => i.itemId === item.itemId);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + qty;
    } else {
        targetInventory.push({ ...item, quantity: qty });
    }

    if (item.quantity <= qty) {
        inventory.splice(index, 1);
    } else {
        item.quantity -= qty;
    }

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

    // Находим userId получателя через персонажа
    const targetCharDoc = await getDoc(doc(db, "characters", targetCharId));
    if (!targetCharDoc.exists()) { log('ПОЛУЧАТЕЛЬ НЕ НАЙДЕН'); return; }
    const targetUserId = targetCharDoc.data().userId;

    // Получаем документ получателя (users)
    const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
    if (!targetUserDoc.exists()) { log('ПОЛЬЗОВАТЕЛЬ ПОЛУЧАТЕЛЯ НЕ НАЙДЕН'); return; }
    const targetCurrencies = targetUserDoc.data().currencies || { pink: 0, gray: 0, yellow: 0 };

    // Списываем у отправителя
    const newSenderCurrencies = {
        pink: currencies.pink - pink,
        gray: currencies.gray - gray,
        yellow: currencies.yellow - yellow
    };
    await updateDoc(doc(db, "users", currentUser.uid), { currencies: newSenderCurrencies });

    // Зачисляем получателю
    const newTargetCurrencies = {
        pink: (targetCurrencies.pink || 0) + pink,
        gray: (targetCurrencies.gray || 0) + gray,
        yellow: (targetCurrencies.yellow || 0) + yellow
    };
    await updateDoc(doc(db, "users", targetUserId), { currencies: newTargetCurrencies });

    log(`ПЕРЕДАНО: ${pink}Р ${gray}С ${yellow}Ж`);
    renderTransfer();
}
