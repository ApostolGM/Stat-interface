// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setCurrencies, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { isMaster, initAdminPanel } from './admin/admin-main.js';
import { cleanupGroups } from './admin/admin-groups.js';

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    group: () => renderGroup(),
    admin: () => {} // Админка теперь в боковой панели
};

function onDataUpdate(data) {
    setCurrencies(data.currencies || { pink: 0, gray: 0, yellow: 0 });
    setInventory(data.inventory || []);
}

document.addEventListener('DOMContentLoaded', () => {
    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', async () => {
        await signOutUser();
    });

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', async () => {
        cleanupShop();
        cleanupLoot();
        cleanupGroups();
        resetAdminOnLogout();
        await signOutUser();
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

    // Кнопка АДМИН в терминале (оставлена для совместимости)
    const adminTabBtn = document.getElementById('adminTab');
    if (adminTabBtn) {
        adminTabBtn.addEventListener('click', () => {
            // Открываем боковую панель вместо старой вкладки
            document.getElementById('adminOverlay').classList.remove('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
        });
    }

    // Обработчик выбора персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char === null) {
            // Мастерский вход без персонажа — открываем админ-панель
            document.getElementById('adminOverlay').classList.remove('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            showTab('shop', renderFunctions);
        } else {
            // Обычный вход с персонажем
            showTab('shop', renderFunctions);
        }
    });

    // Инициализация авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, onDataUpdate);
            initShop(user.uid);

            // Настройка видимости кнопок для мастера
            if (isMaster(currentUserId)) {
                document.getElementById('adminTab').style.display = 'inline-block';
                document.getElementById('openAdminBtn').classList.remove('hidden');
                initAdminPanel();
            } else {
                document.getElementById('adminTab').style.display = 'none';
                document.getElementById('openAdminBtn').classList.add('hidden');
            }
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
