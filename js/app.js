// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================
window.state = {
    tokens: 3,
    inventory: [],
    currentMainTab: 'shop',
    currentSubTab: 'food',
    soundEnabled: false,
    isAdmin: false
};

// shopItems будет заполнен после загрузки данных (глобально)
let shopItems = {};

// ==================== ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ ====================
async function init() {
    // Загружаем данные (из localStorage или JSON)
    await loadAdminData();                         // функция из admin.js
    applyPricesToItems();                          // пересчитывает цены
    // Заполняем shopItems из adminData для совместимости с рендером
    for (let cat in adminData.items) {
        shopItems[cat] = adminData.items[cat].map(item => ({
            ...item,
            displayPrice: getFinalPrice(item.price, cat)
        }));
    }
    setupTabs();
    renderAll();
}

// ==================== ОТРИСОВКА ОСНОВНОГО ИНТЕРФЕЙСА ====================
function renderApp() {
    if (state.isAdmin) {
        renderAdminScreen();   // из admin.js
        return;
    }
    // Обычный вид для игроков
    const app = document.getElementById('appScreen');
    if (!app) return;
    app.innerHTML = `
        <div class="header">
            <h1>APOSTOL</h1>
            <div class="header-controls">
                <div class="balance">РК: <span id="balanceDisplay">${state.tokens}</span></div>
                <button id="soundToggle" class="sound-btn">🔊</button>
                <span id="adminLink" style="cursor:pointer; margin-left:10px;" title="Админ-панель">⚙</span>
            </div>
        </div>
        <div class="main-tabs">
            <div class="main-tab active" data-tab="shop">Магазин</div>
            <div class="main-tab" data-tab="inventory">Инвентарь</div>
        </div>
        <div id="shopSubTabs" class="sub-tabs">
            <div class="sub-tab active" data-sub="food">Еда</div>
            <div class="sub-tab" data-sub="weapons">Оружие</div>
            <div class="sub-tab" data-sub="bestiary">Бестиарий</div>
            <div class="sub-tab" data-sub="lootboxes">Лутбоксы</div>
        </div>
        <div id="content" class="content"></div>
    `;

    // Обработчики вкладок
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentMainTab = tab.dataset.tab;
            document.getElementById('shopSubTabs').classList.toggle('hidden', state.currentMainTab !== 'shop');
            renderAll();
        });
    });
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentSubTab = tab.dataset.sub;
            renderAll();
        });
    });

    // Кнопка звука
    document.getElementById('soundToggle').addEventListener('click', toggleSound); // из sound.js
    // Админ-ссылка
    document.getElementById('adminLink').addEventListener('click', () => {
        const password = prompt('Мастер-пароль:');
        if (password === 'твой_пароль') {   // замени на свой пароль
            state.isAdmin = true;
            renderApp();
        } else {
            alert('Неверный пароль');
        }
    });

    // Наполняем контентом текущую вкладку
    renderContent();
}

// ==================== КОНТЕНТ ВКЛАДОК ====================
function renderContent() {
    const container = document.getElementById('content');
    if (!container) return;
    container.innerHTML = '';
    if (state.currentMainTab === 'shop') {
        renderShop(container);
    } else if (state.currentMainTab === 'inventory') {
        renderInventory(container);
    }
}

function renderShop(container) {
    const sub = state.currentSubTab;
    const items = shopItems[sub] || [];

    if (sub === 'lootboxes') {
        // Специальная отрисовка лутбоксов
        items.forEach(box => {
            const card = document.createElement('div');
            card.className = 'card lootbox-card';
            card.innerHTML = `
                <h3>${box.name}</h3>
                <div class="desc">${box.desc}</div>
                <div class="price">💰 ${box.displayPrice} РК</div>
                <button class="roll-btn" data-id="${box.id}" data-price="${box.displayPrice}" ${box.displayPrice > state.tokens ? 'disabled' : ''}>
                    Открыть
                </button>
                <div class="lootbox-result" id="result-${box.id}"></div>
            `;
            card.querySelector('.roll-btn').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const price = parseInt(btn.dataset.price);
                if (state.tokens < price) return;
                state.tokens -= price;
                updateBalance();
                const result = rollLoot(box.id);   // rollLoot определена в shop-data.js (оставили как есть)
                document.getElementById(`result-${box.id}`).innerHTML = 
                    `<span style="color:var(--accent);">${result.name}</span> <small>[${result.rarity}]</small>`;
                state.inventory.push(result.name);
                renderAll();
            });
            container.appendChild(card);
        });
    } else {
        // Обычные товары (еда, оружие, бестиарий)
        const grid = document.createElement('div');
        grid.className = 'grid';
        items.forEach(item => {
            const card = createItemCard(item);
            grid.appendChild(card);
        });
        container.appendChild(grid);
    }
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    // Изображение товара, если есть
    const imageHTML = item.image 
        ? `<img src="${item.image}" alt="${item.name}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;" loading="lazy">`
        : '';
    card.innerHTML = `
        ${imageHTML}
        <h3>${item.name}</h3>
        <div class="desc">${item.desc}</div>
        <div class="price">${item.displayPrice > 0 ? '💰 ' + item.displayPrice + ' РК' : 'Бесплатно'}</div>
        <button class="buy-btn" data-price="${item.displayPrice}" ${item.displayPrice > state.tokens ? 'disabled' : ''}>
            ${item.displayPrice > 0 ? 'Купить' : 'Изучить'}
        </button>
    `;
    card.querySelector('.buy-btn').addEventListener('click', (e) => {
        const price = parseInt(e.currentTarget.dataset.price);
        if (state.tokens < price) return;
        state.tokens -= price;
        state.inventory.push(item.name);
        updateBalance();
        renderAll();
    });
    return card;
}

function renderInventory(container) {
    const list = document.createElement('ul');
    list.className = 'inventory-list';
    if (state.inventory.length === 0) {
        list.innerHTML = '<li>Инвентарь пуст</li>';
    } else {
        const counts = {};
        state.inventory.forEach(item => counts[item] = (counts[item] || 0) + 1);
        for (let [name, count] of Object.entries(counts)) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${name}</span><span class="item-count">x${count}</span>`;
            list.appendChild(li);
        }
    }
    container.appendChild(list);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================
function updateBalance() {
    const el = document.getElementById('balanceDisplay');
    if (el) el.textContent = state.tokens;
}

function renderAll() {
    renderContent();
    updateBalance();
}

// ==================== ТАБЛИЦЫ ЛУТА (оставим здесь, т.к. rollLoot используется) ====================
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

// ==================== ЗАПУСК ====================
init();
