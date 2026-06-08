// admin/admin-events.js
import { log } from '../shared.js';
import { updateGroupData } from '../groups-config.js';

export function renderEventsAdmin(group, container) {
    const event = group.events;
    
    let html = '<h3>СОБЫТИЯ</h3>';
    
    if (event?.active) {
        html += `
            <div style="background:var(--card-bg); padding:10px; border:1px solid var(--border-color); margin-bottom:10px;">
                <p><strong>АКТИВНО: ${event.name}</strong></p>
                <p>${event.description || ''}</p>
                <p>Цены: ×${event.priceMultiplier || 1}</p>
                <button id="deactivateEventBtn">ДЕАКТИВИРОВАТЬ</button>
            </div>`;
    } else {
        html += '<p style="opacity:0.6;">НЕТ АКТИВНЫХ СОБЫТИЙ</p>';
    }
    
    const presets = [
        { id: "storm", name: "РАДИАЦИОННЫЙ ШТОРМ", description: "Цены повышены, связь нестабильна", multiplier: 2 },
        { id: "trader", name: "КАРАВАН ТОРГОВЦЕВ", description: "Цены снижены, редкие товары в наличии", multiplier: 0.7 },
        { id: "blockade", name: "БЛОКАДА", description: "Обычные товары недоступны", multiplier: 3 }
    ];
    
    html += '<h4>ПРЕСЕТЫ:</h4>';
    html += '<div style="display:flex; flex-direction:column; gap:6px;">';
    presets.forEach(p => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border-color);">
                <span>${p.name} (×${p.multiplier})</span>
                <button data-id="${p.id}" class="activateEventBtn">АКТИВИРОВАТЬ</button>
            </div>`;
    });
    html += '</div>';
    
    container.innerHTML = html;
    
    if (event?.active) {
        document.getElementById('deactivateEventBtn').onclick = async () => {
            await updateGroupData(group.id, { events: null });
            log('СОБЫТИЕ ДЕАКТИВИРОВАНО');
        };
    }
    
    document.querySelectorAll('.activateEventBtn').forEach(btn => {
        btn.onclick = async () => {
            const preset = presets.find(p => p.id === btn.dataset.id);
            if (preset) {
                await updateGroupData(group.id, {
                    events: {
                        active: true,
                        ...preset,
                        priceMultiplier: preset.multiplier
                    }
                });
                log(`СОБЫТИЕ "${preset.name}" АКТИВИРОВАНО`);
            }
        };
    });
}
