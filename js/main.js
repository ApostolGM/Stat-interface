// main.js
import { setupAuth, signIn, signUp, signOutUser } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log } from './ui.js';
import { renderShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';

let currentUserId = null;

// Рендер-функции для вкладок
const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory()
};

// Обработчик изменений данных из Firestore
function onDataUpdate(data) {
    setTokens(data.tokens);
    setInventory(data.inventory);
    // Обновить текущую вкладку, если терминал открыт
    const terminal = document.getElementById('terminal');
    if (!terminal.classList.contains('hidden')) {
        if (!document.getElementById('shopContent').classList.contains('hidden')) renderShop(currentUserId);
        else if (!document.getElementById('lootContent').classList.contains('hidden')) renderLoot(currentUserId);
        else if (!document.getElementById('inventoryContent').classList.contains('hidden')) renderInventory();
    }
}

// Настройка после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutBtn').addEventListener('click', signOutUser);
    document.getElementById('signOutTerminalBtn').addEventListener('click', signOutUser);
    document.getElementById('enterTerminalBtn').addEventListener('click', () => {
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('terminal').classList.remove('hidden');
        showTab('shop', renderFunctions);
    });

    // Вкладки терминала
    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));

    // Запуск слушателя авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            // Подписка на данные
            subscribeToUserData(user.uid, onDataUpdate);
        } else {
            currentUserId = null;
        }
    });
});
