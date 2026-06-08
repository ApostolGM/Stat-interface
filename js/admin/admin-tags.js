// admin/admin-tags.js
import { log } from '../shared.js';
import { subscribeToTags, updateTags } from '../tags-config.js';

let tagsCache = [];

export function renderTagsAdmin() {
    const inner = document.getElementById('adminInnerContent');
    const tags = [...tagsCache];
    
    let html = '<h3>УПРАВЛЕНИЕ ТЭГАМИ</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:6px; max-height:250px; overflow-y:auto; margin-bottom:12px;">';
    tags.forEach(tag => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border-color);">
                <span style="display:flex; align-items:center; gap:8px;">
                    <span style="width:16px;height:16px;background:${tag.color};border-radius:3px;display:inline-block;"></span>
                    <span>${tag.name}</span>
                    <span style="font-size:10px;opacity:0.6;">${tag.id}</span>
                </span>
                <button data-id="${tag.id}" class="deleteTagBtn" style="font-size:10px; padding:4px 6px; flex:none;">🗑️</button>
            </div>`;
    });
    html += '</div>';
    
    html += `
        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
            <h4>НОВЫЙ ТЭГ</h4>
            <div style="display:flex; gap:8px;">
                <input type="text" id="newTagId" placeholder="ID (латиница)" style="flex:1;">
                <input type="text" id="newTagName" placeholder="НАЗВАНИЕ" style="flex:1;">
                <input type="color" id="newTagColor" value="#888888" style="width:40px;">
                <button id="addTagBtn">СОЗДАТЬ</button>
            </div>
        </div>`;
    inner.innerHTML = html;

    document.querySelectorAll('.deleteTagBtn').forEach(btn => {
        btn.onclick = async () => {
            const newTags = tagsCache.filter(t => t.id !== btn.dataset.id);
            await updateTags(newTags);
            log('ТЭГ УДАЛЁН');
        };
    });

    document.getElementById('addTagBtn').onclick = async () => {
        const id = document.getElementById('newTagId').value.trim().toLowerCase();
        const name = document.getElementById('newTagName').value.trim();
        const color = document.getElementById('newTagColor').value;
        if (!id || !name) return;
        if (tagsCache.find(t => t.id === id)) {
            log('ТЭГ С ТАКИМ ID УЖЕ СУЩЕСТВУЕТ');
            return;
        }
        const newTags = [...tagsCache, { id, name, color }];
        await updateTags(newTags);
        log(`ТЭГ "${name}" СОЗДАН`);
        document.getElementById('newTagId').value = '';
        document.getElementById('newTagName').value = '';
    };
}

// Подписка на тэги
subscribeToTags(tags => {
    tagsCache = tags;
});
