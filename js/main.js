// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { renderAdmin, isMaster } from './admin/admin-main.js';
import { cleanupGroups } from './admin/admin-groups.js';

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
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        cleanupShop();
        cleanupLoot();
        cleanupGroups();
        signOutUser();
    });

    document.getElementById('changeCharBtn').addEventListener('click', () => {
        document.getElementById('terminal').classList.add('hidden');
        import('./auth.js').then(m => m.showCharacterScreen({ uid: currentUserId }));
    });

    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));
    document.getElementById('groupTab').addEventListener('click', () => showTab('group', renderFunctions));
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char === null) showTab('admin', renderFunctions);
        else showTab('shop', renderFunctions);
    });

    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, onDataUpdate);
            initShop(user.uid);
            const adminBtn = document.getElementById('adminTab');
            if (adminBtn) {
                adminBtn.style.display = isMaster(currentUserId) ? 'inline-block' : 'none';
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
        hum.volume = 0.03; hum.play().catch(() => {});
        btn.innerHTML = '🔊';
    } else {
        hum.pause();
        btn.innerHTML = '🔇';
    }
};
