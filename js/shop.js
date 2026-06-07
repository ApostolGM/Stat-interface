// shop.js
import { updateUserData } from './db.js';
import { getTokens, getInventory, setTokens, setInventory, log } from './ui.js';

export function renderShop(userId) {
    document.getElementById('shopContent').innerHTML = `
        <div class="item-grid">
            <div class="item-card" id="buyPatrons">🔫 ПАТРОНЫ<br><small>1 жетон</small></div>
            <div class="item-card" id="buyMedkit">🏥 АПТЕЧКА<br><small>2 жетона</small></div>
            <div class="item-card" id="buyBattery">🔋 БАТАРЕЯ<br><small>1 жетон</small></div>
            <div class="item-card" id="buyWater">💧 ВОДА<br><small>1 жетон</small></div>
        </div>
        <p style="text-align:center; margin-top:15px; opacity:0.7;">[ Жетоны можно найти в Пустоши ]</p>
    `;
    document.getElementById('buyPatrons').onclick = () => buyItem(userId, 'patrons', 1);
    document.getElementById('buyMedkit').onclick = () => buyItem(userId, 'medkit', 2);
    document.getElementById('buyBattery').onclick = () => buyItem(userId, 'battery', 1);
    document.getElementById('buyWater').onclick = () => buyItem(userId, 'water', 1);
}

async function buyItem(userId, item, cost) {
    if (getTokens() < cost) {
        log('ОШИБКА: НЕДОСТАТОЧНО ЖЕТОНОВ.');
        return;
    }
    const itemNames = { patrons: 'Патроны (10 шт.)', medkit: 'Аптечка', battery: 'Батарея', water: 'Фляга с водой' };
    const itemName = itemNames[item];
    const newTokens = getTokens() - cost;
    const newInventory = [...getInventory(), itemName];
    await updateUserData(userId, { tokens: newTokens, inventory: newInventory });
    log('КУПЛЕНО: ' + itemName + '. -' + cost + ' ЖЕТОН.');
}
