// main.js
import { setupAuth, signIn, signUp, signOutUser } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderAdmin } from './admin.js';

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    admin: () => renderAdmin()
};

function onDataUpdate(data) {
    console.log('onDataUpdate called', data);
    setTokens(data.tokens);
    setInventory(data.inventory);
    // Интерфейс обновляется автоматически через подписки Firebase
    const terminal = document.getElementById('terminal');
    if (!terminal.classList.contains('hidden')) {
        if (!document.getElementById('lootContent').classList.contains('hidden')) renderLoot(currentUserId);
        else if (!document.getElementById('inventoryContent').classList.contains('hidden')) renderInventory();
        else if (!document.getElementById('adminContent')?.classList.contains('hidden')) renderAdmin();
        // Магазин обновляется сам через подписку, не нужно вызывать renderShop
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);

    // Выход из аккаунта (экран авторизации)
    document.getElementById('signOutBtn').addEventListener('click', () => {
        cleanupShop();
        signOutUser();
    });

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        resetAdminOnLogout();
        cleanupShop();
        signOutUser();
    });

    // Вход в терминал
    document.getElementById('enterTerminalBtn').addEventListener('click', () => {
        console.log('enterTerminalBtn clicked');
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('terminal').classList.remove('hidden');
        showTab('shop', renderFunctions);
    });

    // Вкладки терминала
    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));

    const adminTabBtn = document.getElementById('adminTab');
    if (adminTabBtn) {
        adminTabBtn.addEventListener('click', () => showTab('admin', renderFunctions));
    }

    // Запуск слушателя авторизации
    setupAuth((user) => {
        console.log('setupAuth callback, user:', user);
        if (user) {
            currentUserId = user.uid;
            console.log('Subscribing to user data...');
            subscribeToUserData(user.uid, onDataUpdate);
            // Инициализируем магазин (постоянная подписка на изменения)
            initShop(user.uid);
        } else {
            currentUserId = null;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('auth').classList.remove('hidden');
        }
    });
});
