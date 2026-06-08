// admin/admin-main.js
import { currentUserRole, currentUserGroupIds } from '../auth.js';
import { subscribeToGroups } from '../groups-config.js';
import { subscribeToTags } from '../tags-config.js';
import { renderPlayersAdmin } from './admin-players.js';
import { renderShopAdmin } from './admin-shop.js';
import { renderLootboxAdmin } from './admin-lootboxes.js';
import { renderGroupsAdmin } from './admin-groups.js';
import { renderTagsAdmin } from './admin-tags.js';
import { renderItemsAdmin } from './admin-items.js';
import { renderEventsAdmin } from './admin-events.js';

let allGroups = [];
let tagsCache = [];
let selectedGroupId = null;
let adminMode = 'groups';

export function initAdmin() {
    subscribeToGroups(groups => { allGroups = groups; });
    subscribeToTags(tags => { tagsCache = tags; });
}

export function renderAdmin() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    if (currentUserRole === 'player') {
        container.innerHTML = '<p>ДОСТУП ЗАКРЫТ</p>';
        return;
    }

    if (!selectedGroupId) {
        renderGroupSelection(container);
    } else {
        renderGroupAdmin(container);
    }
}

function renderGroupSelection(container) {
    let groupsToShow = allGroups;
    if (currentUserRole === 'group_master') {
        groupsToShow = allGroups.filter(g => currentUserGroupIds.includes(g.id));
    }

    let html = '<h3>ВЫБЕРИТЕ ГРУППУ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px;">';
    groupsToShow.forEach(g => {
        html += `<button class="selectGroupForAdminBtn" data-group-id="${g.id}">${g.name}</button>`;
    });
    if (currentUserRole === 'master') {
        html += '<button id="globalModeBtn" style="margin-top:10px;">🌐 ГЛОБАЛЬНЫЕ НАСТРОЙКИ</button>';
    }
    html += '</div>';
    container.innerHTML = html;

    document.querySelectorAll('.selectGroupForAdminBtn').forEach(btn => {
        btn.onclick = () => {
            selectedGroupId = btn.dataset.groupId;
            renderAdmin();
        };
    });
    if (currentUserRole === 'master') {
        document.getElementById('globalModeBtn').onclick = () => {
            selectedGroupId = null;
            adminMode = 'tags';
            renderGlobalAdmin(container);
        };
    }
}

function renderGroupAdmin(container) {
    const group = allGroups.find(g => g.id === selectedGroupId);
    if (!group) return;

    container.innerHTML = `
        <div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
            <button id="apPlayers" class="${adminMode==='players'?'active':''}">ИГРОКИ</button>
            <button id="apShop" class="${adminMode==='shop'?'active':''}">МАГАЗИН</button>
            <button id="apLoot" class="${adminMode==='lootboxes'?'active':''}">ЛУТБОКСЫ</button>
            <button id="apEvents" class="${adminMode==='events'?'active':''}">СОБЫТИЯ</button>
            <button id="backToGroupsBtn">← ГРУППЫ</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('apPlayers').onclick = () => { adminMode='players'; renderGroupAdmin(container); };
    document.getElementById('apShop').onclick = () => { adminMode='shop'; renderGroupAdmin(container); };
    document.getElementById('apLoot').onclick = () => { adminMode='lootboxes'; renderGroupAdmin(container); };
    document.getElementById('apEvents').onclick = () => { adminMode='events'; renderGroupAdmin(container); };
    document.getElementById('backToGroupsBtn').onclick = () => { selectedGroupId = null; renderAdmin(); };

    const inner = document.getElementById('adminInnerContent');
    if (adminMode === 'players') renderPlayersAdmin(group, inner);
    else if (adminMode === 'shop') renderShopAdmin(group, inner);
    else if (adminMode === 'lootboxes') renderLootboxAdmin(group, inner);
    else if (adminMode === 'events') renderEventsAdmin(group, inner);
}

function renderGlobalAdmin(container) {
    container.innerHTML = `
        <div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
            <button id="apTags" class="${adminMode==='tags'?'active':''}">ТЭГИ</button>
            <button id="apItems" class="${adminMode==='items'?'active':''}">ПРЕДМЕТЫ</button>
            <button id="apGroups" class="${adminMode==='groups'?'active':''}">ГРУППЫ</button>
            <button id="backToSelectionBtn">← ВЫБОР ГРУППЫ</button>
        </div>
        <div id="adminInnerContent"></div>
    `;

    document.getElementById('apTags').onclick = () => { adminMode='tags'; renderGlobalAdmin(container); };
    document.getElementById('apItems').onclick = () => { adminMode='items'; renderGlobalAdmin(container); };
    document.getElementById('apGroups').onclick = () => { adminMode='groups'; renderGlobalAdmin(container); };
    document.getElementById('backToSelectionBtn').onclick = () => { selectedGroupId = null; adminMode = 'groups'; renderAdmin(); };

    const inner = document.getElementById('adminInnerContent');
    if (adminMode === 'tags') renderTagsAdmin(inner);
    else if (adminMode === 'items') renderItemsAdmin(inner);
    else if (adminMode === 'groups') renderGroupsAdmin('adminInnerContent');
}

export function getGroupById(id) { return allGroups.find(g => g.id === id); }
export function getTagsCache() { return tagsCache; }
