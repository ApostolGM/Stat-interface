// main.js
import { setupAuth, signIn, signUp, signOutUser } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderAdmin } from './admin.js';
import { initGroups, cleanupGroups } from './groups.js';

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
    const terminal = document.getElementById('terminal');
    if (!terminal.classList.contains('hidden')) {
        if (!document.getElementById('lootContent').classList.contains('hidden')) renderLoot(currentUserId);
        else if (!document.getElementById('inventoryContent').classList.contains('hidden')) renderInventory();
        else if (!document.getElementById('adminContent')?.classList.contains('hidden')) renderAdmin();
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
        cleanupLoot();
        cleanupGroups();
        signOutUser();
    });

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        resetAdminOnLogout();
        cleanupShop();
        cleanupLoot();
        cleanupGroups();
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
            initShop(user.uid);
            initGroups();
        } else {
            currentUserId = null;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('auth').classList.remove('hidden');
        }
    });
});

// Глобальная функция для переключения звука
window.toggleSound = function() {
    const hum = document.getElementById('bgHum');
    const btn = document.getElementById('soundToggle');
    if (hum.paused) {
        hum.volume = 0.03;
        hum.play().catch(() => {});
        btn.innerHTML = '🔊 ЗВУК';
    } else {
        hum.pause();
        btn.innerHTML = '🔇 ТИШИНА';
    }
};
