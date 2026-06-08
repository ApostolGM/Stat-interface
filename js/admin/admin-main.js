// admin/admin-main.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { subscribeToShop } from '../shop-config.js';
import { subscribeToLootboxes } from '../lootbox-config.js';
import { subscribeToTags } from '../tags-config.js';
import { subscribeToItems } from '../items-config.js';
import { renderPlayersAdmin } from './admin-players.js';
import { renderShopAdmin, resetShopAdmin } from './admin-shop.js';
import { renderLootboxAdmin } from './admin-lootboxes.js';
import { renderGroupsAdmin, initGroups } from './admin-groups.js';
import { renderTagsAdmin } from './admin-tags.js';
import { renderItemsAdmin } from './admin-items.js';
import { renderEventsAdmin } from './admin-events.js';

// ⚠️ ЗАМЕНИ НА СВОЙ UID ИЗ КОНСОЛИ FIREBASE
const MASTER_UIDS = ["твой-uid-здесь"];

let currentUser = null;
onAuthStateChanged(auth, (user) => { currentUser = user; });

let shopCategories = {};
let lootboxesCache = [];
let tagsCache = [];
let itemsCache = [];
let adminMode = 'players';

export function isMaster(uid) {
    return MASTER_UIDS.includes(uid);
}

export function getShopCategories() { return shopCategories; }
export function getLootboxesCache() { return lootboxesCache; }
export function getTagsCache() { return tagsCache; }
export function getItemsCache() { return itemsCache; }
export function getAdminMode() { return adminMode; }
export function setAdminMode(mode) { adminMode = mode; }
export function getCurrentUser() { return currentUser; }

export function resetAdmin() {
    resetShopAdmin();
    adminMode = 'players';
}

export function initAdminPanel() {
    // Показываем кнопку открытия админки
    const openBtn = document.getElementById('openAdminBtn');
    if (openBtn && currentUser && isMaster(currentUser.uid)) {
        openBtn.classList.remove('hidden');
    }

    // Подписки на все данные
    subscribeToShop(cat => { shopCategories = cat; if (adminMode === 'shop') renderAdminPanel(); });
    subscribeToLootboxes(boxes => { lootboxesCache = boxes; if (adminMode === 'lootboxes') renderAdminPanel(); });
    subscribeToTags(tags => { tagsCache = tags; if (adminMode === 'tags') renderAdminPanel(); });
    subscribeToItems(items => { itemsCache = items; if (adminMode === 'items') renderAdminPanel(); });

    // Кнопка открытия
    if (openBtn) {
        openBtn.onclick = openAdminPanel;
    }

    // Кнопка закрытия и оверлей
    document.getElementById('closeAdminPanelBtn').onclick = closeAdminPanel;
    document.getElementById('adminOverlay').onclick = closeAdminPanel;
}

function openAdminPanel() {
    document.getElementById('adminOverlay').classList.remove('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('openAdminBtn').classList.add('hidden');
    adminMode = 'players';
    renderAdminPanel();
}

function closeAdminPanel() {
    document.getElementById('adminOverlay').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    if (currentUser && isMaster(currentUser.uid)) {
        document.getElementById('openAdminBtn').classList.remove('hidden');
    }
}

export function renderAdminPanel() {
    const modes = {
        players: 'ИГРОКИ',
        shop: 'МАГАЗИН',
        lootboxes: 'ЛУТБОКСЫ',
        groups: 'ГРУППЫ',
        tags: 'ТЭГИ',
        items: 'ПРЕДМЕТЫ',
        events: 'СОБЫТИЯ'
    };
    
    const headerSpan = document.querySelector('.admin-panel-header span');
    if (headerSpan) {
        headerSpan.innerText = '🔑 ' + (modes[adminMode] || 'АДМИН-ПАНЕЛЬ');
    }

    const nav = document.getElementById('adminPanelNav');
    nav.innerHTML = `
        <button id="apPlayers" style="${adminMode === 'players' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ИГРОКИ</button>
        <button id="apShop" style="${adminMode === 'shop' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">МАГАЗИН</button>
        <button id="apLoot" style="${adminMode === 'lootboxes' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЛУТБОКСЫ</button>
        <button id="apGroups" style="${adminMode === 'groups' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ГРУППЫ</button>
        <button id="apTags" style="${adminMode === 'tags' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ТЭГИ</button>
        <button id="apItems" style="${adminMode === 'items' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ПРЕДМЕТЫ</button>
        <button id="apEvents" style="${adminMode === 'events' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">СОБЫТИЯ</button>
    `;

    document.getElementById('apPlayers').onclick = () => { adminMode = 'players'; renderAdminPanel(); };
    document.getElementById('apShop').onclick = () => { adminMode = 'shop'; renderAdminPanel(); };
    document.getElementById('apLoot').onclick = () => { adminMode = 'lootboxes'; renderAdminPanel(); };
    document.getElementById('apGroups').onclick = () => { adminMode = 'groups'; renderAdminPanel(); };
    document.getElementById('apTags').onclick = () => { adminMode = 'tags'; renderAdminPanel(); };
    document.getElementById('apItems').onclick = () => { adminMode = 'items'; renderAdminPanel(); };
    document.getElementById('apEvents').onclick = () => { adminMode = 'events'; renderAdminPanel(); };

    if (adminMode === 'players') renderPlayersAdmin();
    else if (adminMode === 'shop') renderShopAdmin();
    else if (adminMode === 'lootboxes') renderLootboxAdmin();
    else if (adminMode === 'groups') { initGroups(); renderGroupsAdmin('adminPanelContent'); }
    else if (adminMode === 'tags') renderTagsAdmin();
    else if (adminMode === 'items') renderItemsAdmin();
    else if (adminMode === 'events') renderEventsAdmin();
}
