// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { renderAdmin, isMaster } from './admin.js';
import { cleanupGroups } from './groups.js';

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    group: () => renderGroup(),
    admin: () => renderAdmin()
};

function onDataUpdate(data) {
    setTokens(data.tokens);
    setInventory(data.inventory);
}

document.addEventListener('DOMContentLoaded', () => {
    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        cleanupShop();
        cleanupLoot();
        cleanupGroups();
        signOutUser();
    });

    // Смена персонажа
    document.getElementById('changeCharBtn').addEventListener('click', () => {
        document.getElementById('terminal').classList.add('hidden');
        import('./auth.js').then(m => m.showCharacterScreen({ uid: currentUserId }));
    });

    // Вкладки терминала
    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));
    document.getElementById('groupTab').addEventListener('click', () => showTab('group', renderFunctions));
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    // Обработчик выбора персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char === null) {
            // Мастерский вход без персонажа — сразу админка
            showTab('admin', renderFunctions);
        } else {
            // Обычный вход с персонажем — открываем магазин
            showTab('shop', renderFunctions);
        }
    });

    // Инициализация авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, onDataUpdate);
            initShop(user.uid);

            // Настройка видимости кнопки АДМИН в терминале
            const adminBtn = document.getElementById('adminTab');
            if (adminBtn) {
                if (isMaster(currentUserId)) {
                    adminBtn.style.display = 'inline-block';
                } else {
                    adminBtn.style.display = 'none';
                }
            }
            // Не вызываем showTab здесь — ждём выбора персонажа
        } else {
            currentUserId = null;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('auth').classList.remove('hidden');
        }
    });
});

// Глобальная функция переключения звука
window.toggleSound = function() {
    const hum = document.getElementById('bgHum');
    const btn = document.getElementById('soundToggle');
    if (hum.paused) {
        hum.volume = 0.03;
        hum.play().catch(() => {});
        btn.innerHTML = '🔊';
    } else {
        hum.pause();
        btn.innerHTML = '🔇';
    }
};
