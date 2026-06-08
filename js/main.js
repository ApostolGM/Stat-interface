// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { showTab, resetAdminOnLogout } from './ui.js';
import { renderShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { renderTransfer } from './transfer.js';

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
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

    document.getElementById('signOutTerminalBtn').addEventListener('click', async () => {
        resetAdminOnLogout();
        await signOutUser();
    });

    document.getElementById('changeCharBtn').addEventListener('click', () => {
        document.getElementById('terminal').classList.add('hidden');
        import('./auth.js').then(m => m.showCharacterScreen({ uid: currentUserId }));
    });

    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));
    document.getElementById('groupTab').addEventListener('click', () => showTab('group', renderFunctions));
    document.getElementById('transferTab').addEventListener('click', () => showTab('transfer', renderFunctions));
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    // Кнопка 🔑 в правом верхнем углу
    document.getElementById('openAdminBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.remove('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        import('./admin/admin-main.js').then(m => m.openAdminPanel());
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

    // Событие выбора персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char) showTab('shop', renderFunctions);
    });

    // Событие открытия админки с экрана персонажей
    window.addEventListener('openAdmin', () => {
        document.getElementById('adminOverlay').classList.remove('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        import('./admin/admin-main.js').then(m => m.openAdminPanel());
    });

    // Инициализация авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, () => {});
            
            import('./auth.js').then(auth => {
                if (auth.currentUserRole !== 'player') {
                    document.getElementById('adminTab').style.display = 'inline-block';
                    document.getElementById('openAdminBtn').classList.remove('hidden');
                    import('./admin/admin-main.js').then(m => m.initAdmin());
                } else {
                    document.getElementById('adminTab').style.display = 'none';
                    document.getElementById('openAdminBtn').classList.add('hidden');
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