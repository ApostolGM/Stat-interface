// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { showTab, resetAdminOnLogout } from './ui.js';
import { renderShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { renderTransfer } from './transfer.js';
import { initAdmin, openAdminPanel } from './admin/admin-main.js';

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    group: () => renderGroup(),
    transfer: () => renderTransfer(),
    admin: () => {}
};

document.addEventListener('DOMContentLoaded', () => {
    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', async () => {
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
    document.getElementById('transferTab').addEventListener('click', () => showTab('transfer', renderFunctions));
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    // Кнопка 🔑 в углу
    document.getElementById('openAdminBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.remove('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        openAdminPanel();
    });

    // Закрытие админ-панели
    document.getElementById('closeAdminPanelBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    });
    document.getElementById('adminOverlay').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    });

    // Событие открытия админки с экрана персонажей
    window.addEventListener('openAdmin', () => {
        document.getElementById('adminOverlay').classList.remove('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        openAdminPanel();
    });

    // Выбор персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char) showTab('shop', renderFunctions);
    });

    // Инициализация авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, () => {});

            import('./auth.js').then(authMod => {
                if (authMod.currentUserRole !== 'player') {
                    document.getElementById('adminTab').style.display = 'inline-block';
                    document.getElementById('openAdminBtn').classList.remove('hidden');
                    initAdmin();
                } else {
                    document.getElementById('adminTab').style.display = 'none';
                }
            });
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
        hum.volume = 0.03; hum.play().catch(() => {});
        btn.innerHTML = '🔊';
    } else {
        hum.pause(); btn.innerHTML = '🔇';
    }
};
