// admin-players.js
import { getCharacterById } from '../helpers.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { log } from '../shared.js';

export function renderPlayersAdmin(group, container) {
    let html = '<h3>ИГРОКИ ГРУППЫ</h3>';
    if (!group.players || group.players.length === 0) {
        html += '<p>НЕТ ИГРОКОВ</p>';
        container.innerHTML = html;
        return;
    }
    Promise.all(group.players.map(id => getCharacterById(id))).then(chars => {
        chars.forEach(char => {
            if (char) {
                html += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--card-hover-bg);">
                    <span>${char.name}</span>
                    <button data-char-id="${char.id}" class="managePlayerBtn">УПРАВЛЯТЬ</button>
                </div>`;
            }
        });
        html += '<div id="playerDetails" style="margin-top:10px;"></div>';
        container.innerHTML = html;

        document.querySelectorAll('.managePlayerBtn').forEach(btn => {
            btn.onclick = async () => {
                const charId = btn.dataset.charId;
                const char = await getCharacterById(charId);
                if (!char) return;
                const userDoc = await import('../helpers.js').then(m => m.getUserById(char.userId));
                const currencies = userDoc?.currencies || { pink: 0, gray: 0, yellow: 0 };
                const details = document.getElementById('playerDetails');
                details.innerHTML = `
                    <h4>${char.name}</h4>
                    <p>БАЛАНС: ${currencies.pink}Р ${currencies.gray}С ${currencies.yellow}Ж</p>
                    <p>ИНВЕНТАРЬ:</p>
                    <ul>${(char.inventory || []).map(i => `<li>${i.name} x${i.quantity || 1}</li>`).join('')}</ul>
                `;
            };
        });
    });
}