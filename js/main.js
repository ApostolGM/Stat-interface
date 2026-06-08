// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { showTab, resetAdminOnLogout } from './ui.js';
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
    admin: () => {}
};

document.addEventListener('DOMContentLoaded', () => {
    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

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
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    // Обработчик выбора персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char === null) showTab('shop', renderFunctions);
        else showTab('shop', renderFunctions);
    });

    // Инициализация авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, (data) => {
                // Данные обновляются автоматически через shared.js
            });
            initShop(user.uid);

            // Настройка админки
            const adminBtn = document.getElementById('adminTab');
            if (adminBtn && isMaster(currentUserId)) {
                adminBtn.style.display = 'inline-block';
                initAdminPanel();
            } else if (adminBtn) {
                adminBtn.style.display = 'none';
            }
        } else {
            currentUserId = null;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('auth').classList.remove('hidden');
        }
    });
});

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
