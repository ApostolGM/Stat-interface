// admin-main.js
import { currentUserRole, currentUserGroupIds } from '../auth.js';
import { subscribeToGroups } from '../groups-config.js';
import { renderPlayersAdmin } from './admin-players.js';
import { renderShopAdmin } from './admin-shop.js';
import { renderLootboxAdmin } from './admin-lootboxes.js';
import { renderGroupsAdmin } from './admin-groups.js';
import { renderTagsAdmin } from './admin-tags.js';
import { renderItemsAdmin } from './admin-items.js';
import { renderEventsAdmin } from './admin-events.js';

let allGroups = [];
let selectedGroupId = null;
let adminMode = 'players';

export function initAdmin() {
    subscribeToGroups(groups => {
        allGroups = groups;
        if (selectedGroupId && !groups.find(g => g.id === selectedGroupId)) {
            selectedGroupId = null;
        }
    });
}

export function openAdminPanel() {
    if (currentUserRole === 'player') return;
    renderGroupSelection();
}

function renderGroupSelection() {
    const nav = document.getElementById('adminPanelNav');
    nav.innerHTML = '';
    const content = document.getElementById('adminPanelContent');

    let groupsToShow = allGroups;
    if (currentUserRole === 'group_master') {
        groupsToShow = allGroups.filter(g => currentUserGroupIds.includes(g.id));
    }

    let html = '<h3>ВЫБЕРИТЕ ГРУППУ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px;">';
    if (groupsToShow.length === 0) {
        html += '<p>НЕТ ДОСТУПНЫХ ГРУПП</p>';
    } else {
        groupsToShow.forEach(g => {
            html += `<button class="selectGroupForAdminBtn" data-group-id="${g.id}">${g.name}</button>`;
        });
    }
    if (currentUserRole === 'master') {
        html += '<button id="globalModeBtn" style="margin-top:10px;">🌐 ГЛОБАЛЬНЫЕ НАСТРОЙКИ</button>';
    }
    html += '</div>';
    content.innerHTML = html;

    document.querySelectorAll('.selectGroupForAdminBtn').forEach(btn => {
        btn.onclick = () => {
            selectedGroupId = btn.dataset.groupId;
            renderGroupAdmin();
        };
    });
    const globalBtn = document.getElementById('globalModeBtn');
    if (globalBtn) {
        globalBtn.onclick = () => {
            selectedGroupId = null;
            adminMode = 'tags';
            renderGlobalAdmin();
        };
    }
}

function renderGroupAdmin() {
    const group = allGroups.find(g => g.id === selectedGroupId);
    if (!group) return;
    document.querySelector('.admin-panel-header span').innerText = `🔑 ${group.name}`;
    const nav = document.getElementById('adminPanelNav');
    nav.innerHTML = `
        <button id="apPlayers" style="${adminMode==='players'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">ИГРОКИ</button>
        <button id="apShop" style="${adminMode==='shop'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">МАГАЗИН</button>
        <button id="apLoot" style="${adminMode==='lootboxes'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">ЛУТБОКСЫ</button>
        <button id="apEvents" style="${adminMode==='events'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">СОБЫТИЯ</button>
        <button id="backToGroupsBtn">← ГРУППЫ</button>
    `;
    document.getElementById('apPlayers').onclick = () => { adminMode='players'; renderGroupAdmin(); };
    document.getElementById('apShop').onclick = () => { adminMode='shop'; renderGroupAdmin(); };
    document.getElementById('apLoot').onclick = () => { adminMode='lootboxes'; renderGroupAdmin(); };
    document.getElementById('apEvents').onclick = () => { adminMode='events'; renderGroupAdmin(); };
    document.getElementById('backToGroupsBtn').onclick = () => { selectedGroupId = null; renderGroupSelection(); };

    const content = document.getElementById('adminPanelContent');
    if (adminMode === 'players') renderPlayersAdmin(group, content);
    else if (adminMode === 'shop') renderShopAdmin(group, content);
    else if (adminMode === 'lootboxes') renderLootboxAdmin(group, content);
    else if (adminMode === 'events') renderEventsAdmin(group, content);
}

function renderGlobalAdmin() {
    document.querySelector('.admin-panel-header span').innerText = '🔑 ГЛОБАЛЬНО';
    const nav = document.getElementById('adminPanelNav');
    nav.innerHTML = `
        <button id="apTags" style="${adminMode==='tags'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">ТЭГИ</button>
        <button id="apItems" style="${adminMode==='items'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">ПРЕДМЕТЫ</button>
        <button id="apGroups" style="${adminMode==='groups'?'background:var(--button-hover-bg);color:var(--button-hover-text);':''}">ГРУППЫ</button>
        <button id="backToGroupsBtn">← ВЫБОР ГРУППЫ</button>
    `;
    document.getElementById('apTags').onclick = () => { adminMode='tags'; renderGlobalAdmin(); };
    document.getElementById('apItems').onclick = () => { adminMode='items'; renderGlobalAdmin(); };
    document.getElementById('apGroups').onclick = () => { adminMode='groups'; renderGlobalAdmin(); };
    document.getElementById('backToGroupsBtn').onclick = () => { selectedGroupId = null; renderGroupSelection(); };

    const content = document.getElementById('adminPanelContent');
    if (adminMode === 'tags') renderTagsAdmin(content);
    else if (adminMode === 'items') renderItemsAdmin(content);
    else if (adminMode === 'groups') renderGroupsAdmin('adminPanelContent');
}

export function getGroupById(id) {
    return allGroups.find(g => g.id === id);
}