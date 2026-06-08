// admin/admin-groups.js
import { log } from '../shared.js';
import { subscribeToGroups, updateGroups } from '../groups-config.js';
import { findUserByLogin } from './admin-players.js';

let groupsCache = [];
let unsubscribeGroups = null;

export function initGroups() {
    if (unsubscribeGroups) unsubscribeGroups();
    unsubscribeGroups = subscribeToGroups((groups) => {
        groupsCache = groups;
    });
}

export function cleanupGroups() {
    if (unsubscribeGroups) { unsubscribeGroups(); unsubscribeGroups = null; }
}

export function renderGroupsAdmin(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const groups = [...groupsCache];
    let html = '<h3>ГРУППЫ ИГРОКОВ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; margin-bottom:12px;">';
    if (groups.length === 0) {
        html += '<p style="opacity:0.6;">НЕТ СОЗДАННЫХ ГРУПП</p>';
    } else {
        groups.forEach((group, index) => {
            html += `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" class="selectGroupBtn" data-index="${index}">
                        <span>👥 ${group.name} <span style="font-size:10px;opacity:0.6;">(${group.players.length} игроков)</span></span>
                        <button class="deleteGroupBtn" data-index="${index}" style="font-size:10px; padding:2px 6px; flex:none;">🗑️</button>
                    </div>
                </div>`;
        });
    }
    html += '</div>';
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
            <h4 id="groupFormTitle">НОВАЯ ГРУППА</h4>
            <input type="text" id="groupName" placeholder="НАЗВАНИЕ ГРУППЫ">
            <textarea id="groupNotes" placeholder="ЗАМЕТКИ МАСТЕРА" style="width:100%; height:60px; background:var(--content-bg); border:1px solid var(--border-color); color:var(--text-color); font-family:'Courier New',monospace; font-size:12px; padding:8px; resize:vertical;"></textarea>
            <h4>ИГРОКИ</h4>
            <div id="groupPlayersList" style="display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto; margin-bottom:8px;"></div>
            <div style="display:flex; gap:8px;">
                <input type="text" id="newPlayerLogin" placeholder="ЛОГИН ИГРОКА" style="flex:1;">
                <button id="addPlayerToGroupBtn">ДОБАВИТЬ</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button id="saveGroupBtn">СОХРАНИТЬ</button>
                <button id="cancelGroupBtn" style="display:none;">ОТМЕНА</button>
            </div>
            <p id="groupError" style="color:#FF5555; font-size:10px;"></p>
        </div>`;
    container.innerHTML = html;

    let editingIndex = -1;
    let tempPlayers = [];

    function renderPlayers() {
        const list = document.getElementById('groupPlayersList');
        if (!list) return;
        list.innerHTML = '';
        if (tempPlayers.length === 0) {
            list.innerHTML = '<p style="font-size:10px;opacity:0.6;">НЕТ ИГРОКОВ</p>';
            return;
        }
        tempPlayers.forEach((player, i) => {
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; background:var(--card-bg); padding:4px 6px; border:1px solid var(--border-color);">
                    <span>👤 ${player}</span>
                    <button data-i="${i}" class="removePlayerBtn" style="font-size:9px; padding:2px 5px; flex:none;">×</button>
                </div>`;
        });
        document.querySelectorAll('.removePlayerBtn').forEach(btn => {
            btn.onclick = () => { tempPlayers.splice(parseInt(btn.dataset.i), 1); renderPlayers(); };
        });
    }

    document.getElementById('addPlayerToGroupBtn').onclick = async () => {
        const login = document.getElementById('newPlayerLogin').value.trim().toLowerCase();
        if (!login) return;
        if (tempPlayers.includes(login)) {
            document.getElementById('groupError').innerText = 'ИГРОК УЖЕ В ГРУППЕ';
            return;
        }
        const user = await findUserByLogin(login);
        if (!user) {
            document.getElementById('groupError').innerText = 'ИГРОК НЕ НАЙДЕН';
            return;
        }
        document.getElementById('groupError').innerText = '';
        tempPlayers.push(login);
        document.getElementById('newPlayerLogin').value = '';
        renderPlayers();
    };

    function loadGroup(group) {
        document.getElementById('groupName').value = group.name;
        document.getElementById('groupNotes').value = group.notes || '';
        tempPlayers = [...(group.players || [])];
        renderPlayers();
    }

    function clearForm() {
        document.getElementById('groupName').value = '';
        document.getElementById('groupNotes').value = '';
        tempPlayers = [];
        renderPlayers();
        editingIndex = -1;
        document.getElementById('groupFormTitle').innerText = 'НОВАЯ ГРУППА';
        document.getElementById('cancelGroupBtn').style.display = 'none';
        document.getElementById('groupError').innerText = '';
    }

    document.querySelectorAll('.selectGroupBtn').forEach(btn => {
        btn.onclick = (e) => {
            if (e.target.classList.contains('deleteGroupBtn')) return;
            editingIndex = parseInt(btn.dataset.index);
            loadGroup(groups[editingIndex]);
            document.getElementById('groupFormTitle').innerText = 'РЕДАКТИРОВАНИЕ';
            document.getElementById('cancelGroupBtn').style.display = 'inline-block';
        };
    });

    document.querySelectorAll('.deleteGroupBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            groups.splice(index, 1);
            await updateGroups(groups);
            log('ГРУППА УДАЛЕНА');
            renderGroupsAdmin(containerId);
        };
    });

    document.getElementById('cancelGroupBtn').onclick = clearForm;

    document.getElementById('saveGroupBtn').onclick = async () => {
        const name = document.getElementById('groupName').value.trim();
        const notes = document.getElementById('groupNotes').value.trim();
        if (!name) { document.getElementById('groupError').innerText = 'ВВЕДИТЕ НАЗВАНИЕ'; return; }
        const group = { id: editingIndex >= 0 ? groups[editingIndex].id : 'group_' + Date.now(), name, players: tempPlayers, notes };
        if (editingIndex >= 0) groups[editingIndex] = group;
        else groups.push(group);
        await updateGroups(groups);
        log(`ГРУППА "${name}" СОХРАНЕНА`);
        clearForm();
        renderGroupsAdmin(containerId);
    };

    renderPlayers();
}
