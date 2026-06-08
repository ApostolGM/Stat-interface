// admin/admin-tags.js
import { log } from '../shared.js';
import { subscribeToTags, updateTags } from '../tags-config.js';

let tagsCache = [];

export function renderTagsAdmin() {
    const inner = document.getElementById('adminPanelContent');
    if (!inner) return;
    
    const tags = [...tagsCache];
    
    let html = '<h3>УПРАВЛЕНИЕ ТЭГАМИ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; margin-bottom:15px;">';
    
    if (tags.length === 0) {
        html += '<p style="opacity:0.6;">НЕТ СОЗДАННЫХ ТЭГОВ</p>';
    } else {
        tags.forEach(tag => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border:1px solid var(--border-color);">
                    <span style="display:flex; align-items:center; gap:10px;">
                        <span style="width:18px;height:18px;background:${tag.color};border-radius:4px;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
                        <span style="font-size:13px;">${tag.name}</span>
                        <span style="font-size:10px;opacity:0.5;">${tag.id}</span>
                    </span>
                    <button data-id="${tag.id}" class="deleteTagBtn" style="font-size:10px; padding:5px 8px; flex:none;">🗑️</button>
                </div>`;
        });
    }
    html += '</div>';
    
    // Форма создания
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:15px;">
            <h4>НОВЫЙ ТЭГ</h4>
            <div style="display:flex; gap:10px; align-items:end;">
                <div style="flex:1;">
                    <label style="font-size:9px; opacity:0.6;">ID (латиница)</label>
                    <input type="text" id="newTagId" placeholder="weapon" style="margin-bottom:0;">
                </div>
                <div style="flex:1;">
                    <label style="font-size:9px; opacity:0.6;">НАЗВАНИЕ</label>
                    <input type="text" id="newTagName" placeholder="Оружие" style="margin-bottom:0;">
                </div>
                <div>
                    <label style="font-size:9px; opacity:0.6;">ЦВЕТ</label>
                    <input type="color" id="newTagColor" value="#FF4444" style="width:45px; height:45px; padding:2px; margin-bottom:0;">
                </div>
                <button id="addTagBtn" style="flex:none; height:45px;">СОЗДАТЬ</button>
            </div>
            <p id="tagError" style="color:#FF5555; font-size:10px; margin-top:5px;"></p>
        </div>
    `;
    
    // Пресеты тэгов для быстрого добавления
    html += `
        <div style="margin-top:15px; border-top:1px solid var(--border-color); padding-top:15px;">
            <h4>БЫСТРЫЕ ПРЕСЕТЫ</h4>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${getPresets().map(p => `
                    <button class="presetTagBtn" data-id="${p.id}" data-name="${p.name}" data-color="${p.color}" style="font-size:9px; padding:6px 10px; flex:none;">
                        <span style="display:inline-block; width:10px; height:10px; background:${p.color}; border-radius:2px; margin-right:4px; vertical-align:middle;"></span>
                        ${p.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    inner.innerHTML = html;
    
    // Удаление тэга
    document.querySelectorAll('.deleteTagBtn').forEach(btn => {
        btn.onclick = async () => {
            const newTags = tagsCache.filter(t => t.id !== btn.dataset.id);
            await updateTags(newTags);
            log('ТЭГ УДАЛЁН');
        };
    });
    
    // Создание тэга
    document.getElementById('addTagBtn').onclick = async () => {
        const id = document.getElementById('newTagId').value.trim().toLowerCase();
        const name = document.getElementById('newTagName').value.trim();
        const color = document.getElementById('newTagColor').value;
        const errorEl = document.getElementById('tagError');
        
        if (!id) { errorEl.innerText = 'ВВЕДИТЕ ID'; return; }
        if (!name) { errorEl.innerText = 'ВВЕДИТЕ НАЗВАНИЕ'; return; }
        if (!/^[a-z0-9_]+$/.test(id)) { errorEl.innerText = 'ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ И _'; return; }
        if (tagsCache.find(t => t.id === id)) { errorEl.innerText = 'ТЭГ С ТАКИМ ID УЖЕ ЕСТЬ'; return; }
        
        const newTags = [...tagsCache, { id, name, color }];
        await updateTags(newTags);
        log(`ТЭГ "${name}" СОЗДАН`);
        document.getElementById('newTagId').value = '';
        document.getElementById('newTagName').value = '';
        errorEl.innerText = '';
    };
    
    // Быстрые пресеты
    document.querySelectorAll('.presetTagBtn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const color = btn.dataset.color;
            
            if (tagsCache.find(t => t.id === id)) {
                log('ТЭГ С ТАКИМ ID УЖЕ ЕСТЬ');
                return;
            }
            
            const newTags = [...tagsCache, { id, name, color }];
            await updateTags(newTags);
            log(`ТЭГ "${name}" ДОБАВЛЕН ИЗ ПРЕСЕТА`);
        };
    });
}

// Список быстрых пресетов
function getPresets() {
    return [
        { id: "weapon", name: "Оружие", color: "#FF4444" },
        { id: "armor", name: "Броня", color: "#4444FF" },
        { id: "med", name: "Медицина", color: "#44FF44" },
        { id: "food", name: "Еда", color: "#FFAA44" },
        { id: "ammo", name: "Патроны", color: "#FF8844" },
        { id: "common", name: "Обычное", color: "#AAAAAA" },
        { id: "rare", name: "Редкое", color: "#4488FF" },
        { id: "legendary", name: "Легендарное", color: "#FFAA00" },
        { id: "bestiary", name: "Бестиарий", color: "#FF44FF" },
        { id: "unique", name: "Уникальное", color: "#FF4488" },
        { id: "quest", name: "Квестовое", color: "#44FFFF" },
        { id: "craft", name: "Крафтовое", color: "#88FF44" }
    ];
}

// Подписка на обновления тэгов
subscribeToTags(tags => {
    tagsCache = tags;
});
