// admin/admin-groups.js
import { db } from '../firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from '../shared.js';
import { subscribeToGroups, updateGroups } from '../groups-config.js';
import { findUserByLogin } from './admin-players.js';

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

    let editingIndex = -1;
    let tempPlayers = [];

    // Рендер списка игроков в форме
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
            btn.onclick = () => {
                tempPlayers.splice(parseInt(btn.dataset.i), 1);
                renderPlayers();
            };
        });
    }

    // Добавление игрока в форму
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
        // Проверяем, есть ли у пользователя персонажи (хотя бы один)
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (!userDoc.exists() || !userDoc.data().characterIds?.length) {
            document.getElementById('groupError').innerText = 'У ИГРОКА НЕТ ПЕРСОНАЖЕЙ';
            return;
        }
        document.getElementById('groupError').innerText = '';
        tempPlayers.push(login);
        document.getElementById('newPlayerLogin').value = '';
        renderPlayers();
    };

    // Загрузка данных группы в форму
    function loadGroup(group) {
        document.getElementById('groupName').value = group.name;
        document.getElementById('groupNotes').value = group.notes || '';
        tempPlayers = [...(group.players || [])]; // здесь логины персонажей, а не ID?
        // В нашем дизайне group.players хранит ID персонажей, но для формы мы показываем логины.
        // Надо бы отображать имена персонажей или логины. Пока оставим так, потом улучшим.
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

    // Обработчики удаления группы
    document.querySelectorAll('.deleteGroupBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const newGroups = groups.filter((_, i) => i !== index);
            await updateGroups(newGroups);
            log('ГРУППА УДАЛЕНА');
        };
    });

    // Принять заявку
    document.querySelectorAll('.acceptAppBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const groupIdx = parseInt(btn.dataset.groupIndex);
            const appIdx = parseInt(btn.dataset.appIndex);
            const group = groups[groupIdx];
            const app = group.applications[appIdx];

            try {
                // Обновить персонажа: установить groupId
                await updateDoc(doc(db, "characters", app.characterId), {
                    groupId: group.id
                });

                // Обновить группу
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

    // Отклонить заявку
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

    // Редактирование группы при клике на неё (но не на кнопки удаления/заявок)
    document.querySelectorAll('.selectGroupBtn').forEach(btn => {
        btn.onclick = (e) => {
            if (e.target.classList.contains('deleteGroupBtn') || e.target.classList.contains('acceptAppBtn') || e.target.classList.contains('rejectAppBtn')) return;
            editingIndex = parseInt(btn.dataset.index);
            loadGroup(groups[editingIndex]);
            document.getElementById('groupFormTitle').innerText = 'РЕДАКТИРОВАНИЕ';
            document.getElementById('cancelGroupBtn').style.display = 'inline-block';
        };
    });

    document.getElementById('cancelGroupBtn').onclick = clearForm;

    // Сохранение группы (создание или обновление)
    document.getElementById('saveGroupBtn').onclick = async () => {
        const name = document.getElementById('groupName').value.trim();
        const notes = document.getElementById('groupNotes').value.trim();
        if (!name) {
            document.getElementById('groupError').innerText = 'ВВЕДИТЕ НАЗВАНИЕ';
            return;
        }

        // tempPlayers содержит логины, нужно преобразовать в ID персонажей
        // Это сложнее, поэтому пока оставим логины как идентификаторы игроков.
        // В будущем можно хранить ID персонажей, а не логины.
        const groupData = {
            id: editingIndex >= 0 ? groups[editingIndex].id : 'group_' + Date.now(),
            name,
            notes,
            players: tempPlayers, // пока что логины
            applications: editingIndex >= 0 ? groups[editingIndex].applications || [] : [],
            baseInventory: editingIndex >= 0 ? groups[editingIndex].baseInventory || [] : [],
            bestiary: editingIndex >= 0 ? groups[editingIndex].bestiary || [] : []
        };

        let newGroups;
        if (editingIndex >= 0) {
            newGroups = groups.map((g, i) => i === editingIndex ? groupData : g);
        } else {
            newGroups = [...groups, groupData];
        }

        await updateGroups(newGroups);
        log(`ГРУППА "${name}" СОХРАНЕНА`);
        clearForm();
        // Ререндер списка произойдёт автоматически через подписку
    };

    renderPlayers();
}
