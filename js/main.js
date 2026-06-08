import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { showTab, resetAdminOnLogout } from './ui.js';
import { renderShop } from './shop.js';
import { renderLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderGroup } from './group-view.js';
import { renderTransfer } from './transfer.js';
import { openAdminPanel, initAdmin } from './admin/admin-main.js';

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

    ['shopTab','lootTab','invTab','groupTab','transferTab','adminTab'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => showTab(id.replace('Tab',''), renderFunctions));
    });

    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        if (char) showTab('shop', renderFunctions);
    });

    window.addEventListener('openAdmin', () => {
        document.getElementById('adminOverlay').classList.remove('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        openAdminPanel();
    });

    document.getElementById('closeAdminPanelBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    });
    document.getElementById('adminOverlay').addEventListener('click', () => {
        document.getElementById('adminOverlay').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    });

    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, () => {});
            const adminBtn = document.getElementById('adminTab');
            import('./auth.js').then(auth => {
                if (auth.currentUserRole !== 'player') {
                    adminBtn.style.display = 'inline-block';
                    document.getElementById('openAdminBtn').classList.remove('hidden');
                    initAdmin();
                } else {
                    adminBtn.style.display = 'none';
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