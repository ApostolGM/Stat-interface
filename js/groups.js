// groups.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { log } from './shared.js';
import { subscribeToGroups, updateGroups } from './groups-config.js';
import { findUserByLogin } from './admin.js';

let groupsCache = [];
let unsubscribeGroups = null;
let selectedGroupId = null;
let groupSubMode = 'players'; // 'players', 'applications', 'base', 'bestiary', 'notes'

export function initGroups() {
    if (unsubscribeGroups) unsubscribeGroups();
    unsubscribeGroups = subscribeToGroups((groups) => {
        groupsCache = groups;
        if (selectedGroupId && !groups.find(g => g.id === selectedGroupId)) {
            selectedGroupId = null;
            groupSubMode = 'players';
        }
        renderGroupsAdmin();
    });
}

export function cleanupGroups() {
    if (unsubscribeGroups) {
        unsubscribeGroups();
        unsubscribeGroups = null;
    }
}

export function renderGroupsAdmin(containerId) {
    const container = document.getElementById(containerId || 'adminInnerContent');
    if (!container) return;

    const groups = [...groupsCache];

    // Если выбрана конкретная группа — показываем её управление
    if (selectedGroupId) {
        renderSingleGroup(container);
        return;
    }

    // Иначе — список всех групп
    let html = '<h3>ГРУППЫ ИГРОКОВ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:8px; max-height:250px; overflow-y:auto; margin-bottom:12px;">';
    if (groups.length === 0) {
        html += '<p style="opacity:0.6;">НЕТ СОЗДАННЫХ ГРУПП</p>';
    } else {
        groups.forEach((group, index) => {
            const appCount = (group.applications || []).length;
            html += `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="selectGroupBtn" data-id="${group.id}" style="cursor:pointer; flex:1;">
                            👥 ${group.name} 
                            <span style="font-size:10px;opacity:0.7;">(${group.players.length} игр.)</span>
                            ${appCount > 0 ? `<span style="color:#FFB000;"> 🔔${appCount}</span>` : ''}
                        </span>
                        <button class="deleteGroupBtn" data-id="${group.id}" style="font-size:10px; padding:4px 6px; flex:none;">🗑️</button>
                    </div>
                </div>`;
        });
    }
    html += '</div>';

    // Форма создания
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
            <h4>НОВАЯ ГРУППА</h4>
            <div style="display:flex; gap:8px;">
                <input type="text" id="newGroupName" placeholder="НАЗВАНИЕ ГРУППЫ" style="flex:1;">
                <button id="createGroupBtn">СОЗДАТЬ</button>
            </div>
        </div>`;
    container.innerHTML = html;

    // Обработчики
    document.querySelectorAll('.selectGroupBtn').forEach(btn => {
        btn.onclick = () => {
            selectedGroupId = btn.dataset.id;
            groupSubMode = 'players';
            renderGroupsAdmin(containerId);
        };
    });

    document.querySelectorAll('.deleteGroupBtn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm('УДАЛИТЬ ГРУППУ?')) return;
            const newGroups = groups.filter(g => g.id !== btn.dataset.id);
            await updateGroups(newGroups);
            log('ГРУППА УДАЛЕНА');
        };
    });

    document.getElementById('createGroupBtn').onclick = async () => {
        const name = document.getElementById('newGroupName').value.trim();
        if (!name) return;
        const newGroup = {
            id: 'group_' + Date.now(),
            name,
            notes: '',
            players: [],
            applications: [],
            baseInventory: [],
            bestiary: []
        };
        await updateGroups([...groups, newGroup]);
        log(`ГРУППА "${name}" СОЗДАНА`);
    };
}

// ========== УПРАВЛЕНИЕ ОДНОЙ ГРУППОЙ ==========
function renderSingleGroup(container) {
    const group = groupsCache.find(g => g.id === selectedGroupId);
    if (!group) {
        selectedGroupId = null;
        renderGroupsAdmin(container.id);
        return;
    }

    let html = `<button id="backToGroups" style="margin-bottom:10px;">← К СПИСКУ ГРУПП</button>`;
    html += `<h3>${group.name}</h3>`;

    // Подменю
    html += `
        <div style="display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap;">
            <button class="subModeBtn" data-mode="players" style="${groupSubMode === 'players' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ИГРОКИ (${group.players.length})</button>
            <button class="subModeBtn" data-mode="applications" style="${groupSubMode === 'applications' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЗАЯВКИ ${(group.applications || []).length ? '🔔' : ''}</button>
            <button class="subModeBtn" data-mode="base" style="${groupSubMode === 'base' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">БАЗА</button>
            <button class="subModeBtn" data-mode="bestiary" style="${groupSubMode === 'bestiary' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">БЕСТИАРИЙ</button>
            <button class="subModeBtn" data-mode="notes" style="${groupSubMode === 'notes' ? 'background:var(--button-hover-bg);color:var(--button-hover-text);' : ''}">ЗАМЕТКИ</button>
        </div>
        <div id="groupSubContent"></div>`;
    container.innerHTML = html;

    document.getElementById('backToGroups').onclick = () => {
        selectedGroupId = null;
        renderGroupsAdmin(container.id);
    };

    document.querySelectorAll('.subModeBtn').forEach(btn => {
        btn.onclick = () => {
            groupSubMode = btn.dataset.mode;
            renderGroupsAdmin(container.id);
        };
    });

    renderSubContent(group);
}

function renderSubContent(group) {
    const sub = document.getElementById('groupSubContent');
    if (!sub) return;

    switch (groupSubMode) {
        case 'players': renderPlayersList(sub, group); break;
        case 'applications': renderApplications(sub, group); break;
        case 'base': renderBaseInventory(sub, group); break;
        case 'bestiary': renderBestiary(sub, group); break;
        case 'notes': renderNotes(sub, group); break;
    }
}

// ========== ИГРОКИ ГРУППЫ ==========
async function renderPlayersList(sub, group) {
    let html = '<h4>ИГРОКИ ГРУППЫ</h4>';
    if (group.players.length === 0) {
        html += '<p>НЕТ ИГРОКОВ</p>';
    } else {
        for (const charId of group.players) {
            const charDoc = await getDoc(doc(db, "characters", charId));
            const char = charDoc.exists() ? charDoc.data() : { name: '???' };
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border:1px solid var(--border-color); margin-bottom:4px; font-size:12px;">
                    <span>👤 ${char.name}</span>
                    <button class="removePlayerBtn" data-charid="${charId}">УДАЛИТЬ</button>
                </div>`;
        }
    }
    html += `
        <div style="display:flex; gap:8px; margin-top:10px;">
            <input type="text" id="addPlayerLogin" placeholder="ЛОГИН ИГРОКА" style="flex:1;">
            <button id="addPlayerBtn">ДОБАВИТЬ</button>
        </div>`;
    sub.innerHTML = html;

    document.querySelectorAll('.removePlayerBtn').forEach(btn => {
        btn.onclick = async () => {
            const newGroups = [...groupsCache];
            const g = newGroups.find(g => g.id === group.id);
            g.players = g.players.filter(id => id !== btn.dataset.charid);
            await updateGroups(newGroups);
            log('ИГРОК УДАЛЁН ИЗ ГРУППЫ');
        };
    });

    document.getElementById('addPlayerBtn').onclick = async () => {
        const login = document.getElementById('addPlayerLogin').value.trim().toLowerCase();
        if (!login) return;
        const user = await findUserByLogin(login);
        if (!user) { alert('ИГРОК НЕ НАЙДЕН'); return; }
        // Ищем первого персонажа пользователя с groupId === group.id или создаём привязку
        const charIds = user.characterIds || [];
        if (charIds.length === 0) { alert('У ИГРОКА НЕТ ПЕРСОНАЖЕЙ'); return; }
        // Для простоты — предлагаем выбрать персонажа (пока берём первого)
        const charId = charIds[0];
        const newGroups = [...groupsCache];
        const g = newGroups.find(g => g.id === group.id);
        if (!g.players.includes(charId)) {
            g.players.push(charId);
            await updateGroups(newGroups);
            // Обновляем персонажа
            const { updateDoc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
            await updateDoc(doc(db, "characters", charId), { groupId: group.id });
            log('ИГРОК ДОБАВЛЕН В ГРУППУ');
        }
    };
}

// ========== ЗАЯВКИ ==========
async function renderApplications(sub, group) {
    const apps = group.applications || [];
    let html = '<h4>ЗАЯВКИ</h4>';
    if (apps.length === 0) {
        html += '<p>НЕТ ЗАЯВОК</p>';
    } else {
        apps.forEach((app, index) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid var(--border-color); margin-bottom:4px; font-size:11px;">
                    <span>👤 ${app.characterName} (пользователь: ${app.userId})</span>
                    <div style="display:flex; gap:5px;">
                        <button class="acceptAppBtn" data-index="${index}">ПРИНЯТЬ</button>
                        <button class="rejectAppBtn" data-index="${index}">ОТКЛОНИТЬ</button>
                    </div>
                </div>`;
        });
    }
    sub.innerHTML = html;

    document.querySelectorAll('.acceptAppBtn').forEach(btn => {
        btn.onclick = async () => {
            const index = parseInt(btn.dataset.index);
            const app = apps[index];
            const newGroups = [...groupsCache];
            const g = newGroups.find(g => g.id === group.id);
            g.players.push(app.characterId);
            g.applications = apps.filter((_, i) => i !== index);
            await updateGroups(newGroups);
            const { updateDoc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
            await updateDoc(doc(db, "characters", app.characterId), { groupId: group.id });
            log(`ЗАЯВКА ${app.characterName} ПРИНЯТА`);
        };
    });

    document.querySelectorAll('.rejectAppBtn').forEach(btn => {
        btn.onclick = async () => {
            const index = parseInt(btn.dataset.index);
            const newGroups = [...groupsCache];
            const g = newGroups.find(g => g.id === group.id);
            g.applications = apps.filter((_, i) => i !== index);
            await updateGroups(newGroups);
            log('ЗАЯВКА ОТКЛОНЕНА');
        };
    });
}

// ========== БАЗОВЫЙ ИНВЕНТАРЬ ==========
function renderBaseInventory(sub, group) {
    const items = group.baseInventory || [];
    let html = '<h4>🏠 БАЗОВЫЙ ИНВЕНТАРЬ</h4>';
    if (items.length === 0) {
        html += '<p>ПУСТО</p>';
    } else {
        items.forEach((item, i) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px; border:1px solid var(--border-color); margin-bottom:3px; font-size:11px;">
                    <span>${item.name} x${item.quantity || 1}</span>
                    <button class="removeBaseItemBtn" data-index="${i}">×</button>
                </div>`;
        });
    }
    html += `
        <div style="display:flex; gap:6px; margin-top:8px;">
            <input type="text" id="baseItemName" placeholder="НАЗВАНИЕ" style="flex:1;">
            <input type="number" id="baseItemQty" placeholder="КОЛ-ВО" value="1" style="width:60px;">
            <button id="addBaseItemBtn">+</button>
        </div>`;
    sub.innerHTML = html;

    document.querySelectorAll('.removeBaseItemBtn').forEach(btn => {
        btn.onclick = async () => {
            const newGroups = [...groupsCache];
            const g = newGroups.find(g => g.id === group.id);
            g.baseInventory.splice(parseInt(btn.dataset.index), 1);
            await updateGroups(newGroups);
        };
    });
    document.getElementById('addBaseItemBtn').onclick = async () => {
        const name = document.getElementById('baseItemName').value.trim();
        const qty = parseInt(document.getElementById('baseItemQty').value) || 1;
        if (!name) return;
        const newGroups = [...groupsCache];
        const g = newGroups.find(g => g.id === group.id);
        g.baseInventory.push({ id: 'base_' + Date.now(), name, quantity: qty });
        await updateGroups(newGroups);
    };
}

// ========== БЕСТИАРИЙ ==========
function renderBestiary(sub, group) {
    const entries = group.bestiary || [];
    let html = '<h4>📖 БЕСТИАРИЙ</h4>';
    if (entries.length === 0) {
        html += '<p>НЕТ ЗАПИСЕЙ</p>';
    } else {
        entries.forEach((entry, i) => {
            html += `
                <div style="padding:6px; border:1px solid var(--border-color); margin-bottom:4px; font-size:11px;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${entry.name}</strong>
                        <button class="removeBestiaryBtn" data-index="${i}">×</button>
                    </div>
                    <small>${entry.description || ''}</small>
                </div>`;
        });
    }
    html += `
        <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <input type="text" id="bestiaryName" placeholder="НАЗВАНИЕ" style="flex:1; min-width:120px;">
            <input type="text" id="bestiaryDesc" placeholder="ОПИСАНИЕ" style="flex:1; min-width:120px;">
            <input type="text" id="bestiaryImage" placeholder="URL КАРТИНКИ" style="width:120px;">
            <button id="addBestiaryBtn">+</button>
        </div>`;
    sub.innerHTML = html;

    document.querySelectorAll('.removeBestiaryBtn').forEach(btn => {
        btn.onclick = async () => {
            const newGroups = [...groupsCache];
            const g = newGroups.find(g => g.id === group.id);
            g.bestiary.splice(parseInt(btn.dataset.index), 1);
            await updateGroups(newGroups);
        };
    });
    document.getElementById('addBestiaryBtn').onclick = async () => {
        const name = document.getElementById('bestiaryName').value.trim();
        const desc = document.getElementById('bestiaryDesc').value.trim();
        const image = document.getElementById('bestiaryImage').value.trim();
        if (!name) return;
        const newGroups = [...groupsCache];
        const g = newGroups.find(g => g.id === group.id);
        g.bestiary.push({ id: 'beast_' + Date.now(), name, description: desc, image });
        await updateGroups(newGroups);
    };
}

// ========== ЗАМЕТКИ ==========
function renderNotes(sub, group) {
    let html = '<h4>📝 ЗАМЕТКИ МАСТЕРА</h4>';
    html += `
        <textarea id="groupNotes" style="width:100%; height:150px; background:var(--content-bg); border:1px solid var(--border-color); color:var(--text-color); font-family:'Courier New',monospace; font-size:12px; padding:10px; resize:vertical;">${group.notes || ''}</textarea>
        <button id="saveNotesBtn" style="margin-top:8px;">СОХРАНИТЬ ЗАМЕТКИ</button>`;
    sub.innerHTML = html;

    document.getElementById('saveNotesBtn').onclick = async () => {
        const notes = document.getElementById('groupNotes').value;
        const newGroups = [...groupsCache];
        const g = newGroups.find(g => g.id === group.id);
        g.notes = notes;
        await updateGroups(newGroups);
        log('ЗАМЕТКИ СОХРАНЕНЫ');
    };
}
