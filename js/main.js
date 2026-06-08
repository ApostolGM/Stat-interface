// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderAdmin, isMaster } from './admin.js';
import { renderGroup } from './group-view.js';
import { cleanupGroups } from './groups.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from './firebase-config.js';

let currentUserId = null;

const renderFunctions = {
    shop: () => renderShop(currentUserId),
    loot: () => renderLoot(currentUserId),
    inventory: () => renderInventory(),
    group: () => renderGroup(),
    admin: () => renderAdmin()
};

function onDataUpdate(data) {
    console.log('onDataUpdate called', data);
    setTokens(data.tokens);
    setInventory(data.inventory);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    // Кнопки авторизации
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signOutFromCharBtn').addEventListener('click', signOutUser);

    // Выход из терминала
    document.getElementById('signOutTerminalBtn').addEventListener('click', () => {
        resetAdminOnLogout();
        cleanupShop();
        cleanupLoot();
        cleanupGroups();
        signOutUser();
    });

    // Смена персонажа
    document.getElementById('changeCharBtn').addEventListener('click', async () => {
        document.getElementById('terminal').classList.add('hidden');
        const { currentUser } = await import('./auth.js');
        if (currentUser) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                showCharacterScreen({ ...userDoc.data(), uid: currentUser.uid });
            }
        }
    });

    // Вкладки терминала
    document.getElementById('shopTab').addEventListener('click', () => showTab('shop', renderFunctions));
    document.getElementById('lootTab').addEventListener('click', () => showTab('loot', renderFunctions));
    document.getElementById('invTab').addEventListener('click', () => showTab('inventory', renderFunctions));
    document.getElementById('groupTab').addEventListener('click', () => showTab('group', renderFunctions));
    document.getElementById('adminTab').addEventListener('click', () => showTab('admin', renderFunctions));

    // Слушатель выбора персонажа
    window.addEventListener('characterSelected', (e) => {
        const char = e.detail;
        document.getElementById('charDisplay').innerText = char.name;
        setTokens(0); // Обновим через подписку на пользователя
        showTab('shop', renderFunctions);
    });

    // Запуск авторизации
    setupAuth((user) => {
        console.log('setupAuth callback, user:', user);
        if (user) {
            currentUserId = user.uid;
            subscribeToUserData(user.uid, onDataUpdate);
            initShop(user.uid);
            
            // Показываем/скрываем кнопку АДМИН в зависимости от UID
            const adminTab = document.getElementById('adminTab');
            if (adminTab) {
                adminTab.style.display = isMaster(user.uid) ? 'inline-block' : 'none';
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
