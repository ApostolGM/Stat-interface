import { getCharacterById } from '../helpers.js';
import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { log } from '../shared.js';

export function renderPlayersAdmin(groupId, container) {
    // Получаем группу из allGroups (можно передавать или импортировать)
    import('./admin-main.js').then(m => {
        const group = m.getGroupById(groupId);
        if (!group) return;
        let html = '<h3>ИГРОКИ ГРУППЫ</h3>';
        group.players.forEach(async (charId) => {
            const char = await getCharacterById(charId);
            if (char) {
                html += `<div>${char.name} (${char.userId})</div>`;
            }
        });
        container.innerHTML = html;
    });
}