// main.js
import { setupAuth, signIn, signUp, signOutUser } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderAdmin } from './admin.js'; // новый импорт

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    admin: () => renderAdmin() // добавлено
};

function onDataUpdate(data) {
    setTokens(data.tokens);
    setInventory(data.inventory);
    const terminal = document.getElementById('terminal');
    if (!terminal.classList.contains('hidden')) {
        if (!document.getElementById('shopContent').classList.contains('hidden')) renderShop(currentUserId);
        else if (!document.getElementById('lootContent').classList.contains('hidden')) renderLoot(currentUserId);
        else if (!document.getElementById('inventoryContent').classList.contains('hidden')) renderInventory();
        else if (!document.getElementById('adminContent')?.classList.contains('hidden')) renderAdmin();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutBtn').addEventListener('click', signOutUser);
    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        resetAdminOnLogout(); // сброс админа
        signOutUser();
    });
    document.getElementById('enterTerminalBtn').addEventListener('click', () => {
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('terminal').classList.remove('hidden');
        showTab('shop', renderFunctions);
    });

    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));

    // Кнопка админа
    const adminTabBtn = document.getElementById('adminTab');
    if (adminTabBtn) {
        adminTabBtn.addEventListener('click', () => showTab('admin', renderFunctions));
    }

    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, onDataUpdate);
        } else {
            currentUserId = null;
        }
    });
});
