// admin/admin-main.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { subscribeToShop } from '../shop-config.js';
import { subscribeToLootboxes } from '../lootbox-config.js';
import { renderPlayersAdmin } from './admin-players.js';
import { renderShopAdmin } from './admin-shop.js';
import { renderLootboxAdmin } from './admin-lootboxes.js';
import { renderGroupsAdmin, initGroups } from './admin-groups.js';

const MASTER_UIDS = ["твой-uid-здесь"];

let currentUser = null;
onAuthStateChanged(auth, (user) => { currentUser = user; });

let shopCategories = {};
let lootboxesCache = [];
let adminMode = 'players';

export function isMaster(uid) {
    return MASTER_UIDS.includes(uid);
}

export function getShopCategories() { return shopCategories; }
export function getLootboxesCache() { return lootboxesCache; }
export function getAdminMode() { return adminMode; }
export function setAdminMode(mode) { adminMode = mode; }

export function getCurrentUser() { return currentUser; }

export async function renderAdmin() {
    const container = document.getElementById('adminContent');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">ЗАГРУЗКА...</p>';
        setTimeout(() => renderAdmin(), 100);
        return;
    }

    if (!isMaster(currentUser.uid)) {
        container.innerHTML = '<p style="color:#FF5555; text-align:center; padding:20px;">ДОСТУП ЗАКРЫТ. ТОЛЬКО ДЛЯ МАСТЕРА.</p>';
        return;
    }

    subscribeToShop((categories) => {
        shopCategories = categories;
        if (adminMode === 'shop') renderShopAdmin();
    });

    subscribeToLootboxes((boxes) => {
        lootboxesCache = boxes;
        if (adminMode === 'lootboxes') renderLootboxAdmin();
    });

    container.innerHTML = `
        <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap;">
            <button id="adminPlayersMode" style="${adminMode === 'players' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ИГРОКИ</button>
            <button id="adminShopMode" style="${adminMode === 'shop' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">МАГАЗИН</button>
            <button id="adminLootMode" style="${adminMode === 'lootboxes' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЛУТБОКСЫ</button>
            <button id="adminGroupsMode" style="${adminMode === 'groups' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ГРУППЫ</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('adminPlayersMode').onclick = () => { adminMode = 'players'; renderAdmin(); };
    document.getElementById('adminShopMode').onclick = () => { adminMode = 'shop'; renderAdmin(); };
    document.getElementById('adminLootMode').onclick = () => { adminMode = 'lootboxes'; renderAdmin(); };
    document.getElementById('adminGroupsMode').onclick = () => { adminMode = 'groups'; renderAdmin(); };

    if (adminMode === 'players') renderPlayersAdmin();
    else if (adminMode === 'shop') renderShopAdmin();
    else if (adminMode === 'lootboxes') renderLootboxAdmin();
    else if (adminMode === 'groups') {
        initGroups();
        renderGroupsAdmin('adminInnerContent');
    }
}