// main.js
import { setupAuth, signIn, signUp, signOutUser, showCharacterScreen } from './auth.js';
import { subscribeToUserData } from './db.js';
import { setTokens, setInventory, showTab, log, resetAdminOnLogout } from './ui.js';
import { renderShop, initShop, cleanupShop } from './shop.js';
import { renderLoot, cleanupLoot } from './lootbox.js';
import { renderInventory } from './inventory.js';
import { renderAdmin, isMaster } from './admin.js';
import { renderGroup } from './group-view.js';

let currentUserId = null;
let currentCharacter = null;

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

function enterTerminal() {
    document.getElementById('characterScreen').classList.add('hidden');
    document.getElementById('terminal').classList.remove('hidden');
    
    // Определяем стартовую вкладку
    const adminBtn = document.getElementById('adminTab');
    if (isMaster(currentUserId)) {
        if (adminBtn) adminBtn.style.display = 'inline-block';
        showTab('admin', renderFunctions);
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
        showTab('shop', renderFunctions);
    }
    
    // Отображаем имя персонажа
    if (currentCharacter) {
        document.getElementById('charDisplay').innerText = currentCharacter.name;
    }
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

    // Слушаем выбор персонажа
    window.addEventListener('characterSelected', (e) => {
        currentCharacter = e.detail;
        currentUserId = currentCharacter.userId;
        // Подписываемся на данные пользователя (баланс РК)
        subscribeToUserData(currentUserId, onDataUpdate);
        initShop(currentUserId);
        enterTerminal();
    });

    // Запуск авторизации
    setupAuth((user) => {
        if (user) {
            currentUserId = user.uid;
            // После логина показывается экран персонажей (в auth.js)
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
