// ==================== ДАННЫЕ МАГАЗИНА И ЛУТБОКСОВ ====================
const shopItems = {
    food: [
        { id: 'canned_meat', name: 'Консервы "Тушёнка"', desc: 'Просрочена, но съедобна.', price: 1 },
        { id: 'water_flask', name: 'Фляга с водой', desc: 'Чистая, без радиации.', price: 1 },
        { id: 'crackers', name: 'Галеты', desc: 'Твёрдые как камень.', price: 1 },
        { id: 'mutant_steak', name: 'Стейк мутанта', desc: '+2 к сытости.', price: 2 }
    ],
    weapons: [
        { id: 'rusty_knife', name: 'Ржавый нож', desc: 'Урон 1d4.', price: 2 },
        { id: 'pipe_pistol', name: 'Трубный пистолет', desc: 'Калибр .38.', price: 3 },
        { id: 'frag_grenade', name: 'Осколочная граната', desc: 'Радиус 3 м.', price: 4 }
    ],
    bestiary: [
        { id: 'radroach_info', name: 'Радтаракан', desc: 'Боится света. Слабое место: усы.', price: 0 },
        { id: 'ghoul_info', name: 'Гуль', desc: 'Обезвредить: выстрел в голову.', price: 0 },
        { id: 'deathclaw_info', name: 'Коготь смерти', desc: 'Уязвим к плазме.', price: 0 }
    ],
    lootboxes: [
        { id: 'box_humanitarian', name: 'Гуманитарка', desc: 'Обычный предмет.', price: 1 },
        { id: 'box_junk', name: 'Барахло-Х', desc: 'Шанс на редкий.', price: 2 },
        { id: 'box_specialist', name: 'Специалист', desc: 'Редкие и легендарные.', price: 3 }
    ]
};

const lootTables = {
    box_humanitarian: [
        { name: 'Банка тушенки', rarity: 'Обычный' },
        { name: 'Фляга с водой', rarity: 'Обычный' },
        { name: 'Бинт', rarity: 'Обычный' },
        { name: 'Батарейки', rarity: 'Обычный' },
        { name: 'Галеты', rarity: 'Обычный' },
        { name: 'Леска', rarity: 'Обычный' },
        { name: 'Пупс', rarity: 'Обычный' },
        { name: 'Флешка', rarity: 'Обычный' },
        { name: 'Гвоздь', rarity: 'Обычный' },
        { name: 'Газета', rarity: 'Обычный' }
    ],
    box_junk: [
        { name: 'Банка тушенки', rarity: 'Обычный', weight: 70 },
        { name: 'Фляга', rarity: 'Обычный', weight: 70 },
        { name: 'Набор отмычек', rarity: 'Редкий', weight: 30 },
        { name: 'Фонарь', rarity: 'Редкий', weight: 30 },
        { name: 'Карта', rarity: 'Редкий', weight: 30 },
        { name: 'Ракетница', rarity: 'Редкий', weight: 30 }
    ],
    box_specialist: [
        { name: 'Набор отмычек', rarity: 'Редкий', weight: 60 },
        { name: 'Фонарь', rarity: 'Редкий', weight: 60 },
        { name: 'Очиститель воды', rarity: 'Легендарный', weight: 40 },
        { name: 'Генератор шума', rarity: 'Легендарный', weight: 40 },
        { name: 'Имплант "Зоркий глаз"', rarity: 'Легендарный', weight: 40 }
    ]
};

// Функция броска лута
function rollLoot(boxId) {
    const table = lootTables[boxId] || [];
    if (table.length === 0) return { name: 'Ничего', rarity: 'Пусто' };
    const totalWeight = table.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (let item of table) {
        random -= (item.weight || 1);
        if (random <= 0) return { name: item.name, rarity: item.rarity };
    }
    return table[table.length - 1];
}
