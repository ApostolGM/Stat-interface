// admin/admin-groups.js
import { db } from '../firebase-config.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from '../shared.js';
import { subscribeToGroups, updateGroups } from '../groups-config.js';
import { findUserByLogin } from '../helpers.js';   // <-- исправлено

let groupsCache = [];
let unsubscribeGroups = null;

export function initGroups() {
    if (unsubscribeGroups) unsubscribeGroups();
    unsubscribeGroups = subscribeToGroups((groups) => {
        groupsCache = groups || [];
    });
}

export function cleanupGroups() {
    if (unsubscribeGroups) {
        unsubscribeGroups();
        unsubscribeGroups = null;
    }
}

export function renderGroupsAdmin(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const groups = [...groupsCache];
    let html = '<h3>ГРУППЫ ИГРОКОВ</h3>';

    // --- Список групп с заявками ---
    html += '<div style="display:flex; flex-direction:column; gap:10px; max-height:350px; overflow-y:auto; margin-bottom:15px;">';
    if (groups.length === 0) {
        html += '<p style="opacity:0.6;">НЕТ СОЗДАННЫХ ГРУПП</p>';
    } else {
        groups.forEach((group, index) => {
            const apps = group.applications || [];
            html += `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong>👥 ${group.name}</strong>
                        <span style="font-size:10px; opacity:0.7;">${group.players.length} игроков</span>
                        <button class="deleteGroupBtn" data-index="${index}" style="font-size:10px; padding:4px 8px; flex:none;">🗑️</button>
                    </div>
                    ${group.notes ? `<p style="font-size:10px; opacity:0.6; margin:5px 0;">📝 ${group.notes}</p>` : ''}
                    ${apps.length > 0 ? `
                        <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:8px;">
                            <span style="font-size:10px;">📩 ЗАЯВКИ (${apps.length})</span>
                            ${apps.map((app, i) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--content-bg); padding:6px 8px; margin-top:4px;">
                                    <span style="font-size:11px;">👤 ${app.characterName}</span>
                                    <div style="display:flex; gap:5px;">
                                        <button class="acceptAppBtn" data-group-index="${index}" data-app-index="${i}" style="font-size:9px; padding:4px 8px; flex:none;">✅</button>
                                        <button class="rejectAppBtn" data-group-index="${index}" data-app-index="${i}" style="font-size:9px; padding:4px 8px; flex:none;">❌</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="font-size:10px; opacity:0.5;">Нет активных заявок</p>'}
                </div>`;
        });
    }
    html += '</div>';

    // --- Форма создания/редактирования группы ---
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
        </div>
    `;
    container.innerHTML = html;

    // ========== ОБРАБОТЧИКИ ==========
    document.querySelectorAll('.deleteGroupBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const newGroups = groups.filter((_, i) => i !== index);
            await updateGroups(newGroups);
            log('ГРУППА УДАЛЕНА');
        };
    });

    document.querySelectorAll('.acceptAppBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const groupIdx = parseInt(btn.dataset.groupIndex);
            const appIdx = parseInt(btn.dataset.appIndex);
            const group = groups[groupIdx];
            const app = group.applications[appIdx];

            try {
                await updateDoc(doc(db, "characters", app.characterId), { groupId: group.id });
                const updatedGroup = { ...group };
                updatedGroup.players = [...(updatedGroup.players || []), app.characterId];
                updatedGroup.applications = (updatedGroup.applications || []).filter((_, i) => i !== appIdx);
                const newGroups = groups.map((g, i) => i === groupIdx ? updatedGroup : g);
                await updateGroups(newGroups);
                log(`ИГРОК ${app.characterName} ПРИНЯТ В ГРУППУ ${group.name}`);
            } catch (error) {
                log('ОШИБКА ПРИ ПРИНЯТИИ: ' + error.message);
            }
        };
    });

    document.querySelectorAll('.rejectAppBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const groupIdx = parseInt(btn.dataset.groupIndex);
            const appIdx = parseInt(btn.dataset.appIndex);
            const group = groups[groupIdx];
            const app = group.applications[appIdx];
            const updatedGroup = { ...group };
            updatedGroup.applications = (updatedGroup.applications || []).filter((_, i) => i !== appIdx);
            const newGroups = groups.map((g, i) => i === groupIdx ? updatedGroup : g);
            await updateGroups(newGroups);
            log(`ЗАЯВКА ${app.characterName} ОТКЛОНЕНА`);
        };
    });

    // ... остальные функции (сохранение, редактирование) используют findUserByLogin из helpers.js
}