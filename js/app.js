// ==================== СОСТОЯНИЕ И ОСНОВНАЯ ЛОГИКА ====================
// В объект state добавь isAdmin
const state = {
    tokens: 3,
    inventory: [],
    currentMainTab: 'shop',
    currentSubTab: 'food',
    soundEnabled: false,
    isAdmin: false   // <-- новое
};

// Вызов после загрузки админ-данных
window.addEventListener('load', async () => {
    await loadAdminData();
    applyPricesToItems();
    // Перерендерить, если уже вошли
    if (state.currentUser) renderAll();
});
const state = {
    tokens: 3,
    inventory: [],
    currentMainTab: 'shop',
    currentSubTab: 'food',
    soundEnabled: false
};

function updateBalance() {
    document.getElementById('balanceDisplay').textContent = state.tokens;
}

function renderContent() {
    const container = document.getElementById('content');
    container.innerHTML = '';
    if (state.currentMainTab === 'shop') renderShop(container);
    else if (state.currentMainTab === 'inventory') renderInventory(container);
}

function renderShop(container) {
    const sub = state.currentSubTab;
    if (sub === 'lootboxes') {
        renderLootboxes(container);
    } else {
        const items = shopItems[sub] || [];
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
    card.innerHTML = `
        <h3>${item.name}</h3>
        <div class="desc">${item.desc}</div>
        <div class="price">${item.price > 0 ? '💰 ' + item.price + ' РК' : 'Бесплатно'}</div>
        <button class="buy-btn" data-id="${item.id}" data-price="${item.price}" ${item.price > state.tokens ? 'disabled' : ''}>
            ${item.price > 0 ? 'Купить' : 'Изучить'}
        </button>
    `;
    card.querySelector('.buy-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const price = parseInt(btn.dataset.price);
        buyItem(price, item.name);
    });
    return card;
}

function renderLootboxes(container) {
    const boxes = shopItems.lootboxes;
    boxes.forEach(box => {
        const card = document.createElement('div');
        card.className = 'card lootbox-card';
        card.innerHTML = `
            <h3>${box.name}</h3>
            <div class="desc">${box.desc}</div>
            <div class="price">💰 ${box.price} РК</div>
            <button class="roll-btn" data-id="${box.id}" data-price="${box.price}" ${box.price > state.tokens ? 'disabled' : ''}>
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
            const result = rollLoot(box.id);
            document.getElementById(`result-${box.id}`).innerHTML = 
                `<span style="color:var(--accent);">${result.name}</span> <small>[${result.rarity}]</small>`;
            state.inventory.push(result.name);
            renderAll();
        });
        container.appendChild(card);
    });
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

function buyItem(price, name) {
    if (state.tokens < price) return;
    state.tokens -= price;
    state.inventory.push(name);
    updateBalance();
    renderAll();
}

function renderAll() {
    renderContent();
    updateBalance();
}

// ==================== НАВИГАЦИЯ ====================
function setupTabs() {
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
}

// Кнопка звука
document.getElementById('soundToggle').addEventListener('click', toggleSound);

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
    setupTabs();
    renderAll();
}

init(document.getElementById('adminLink').addEventListener('click', () => {
    const password = prompt('Мастер-пароль:');
    if (password === 'Пенис') {  // замени на свой
        state.isAdmin = true;
        renderApp();
    } else {
        alert('Неверный пароль');
    }
}););



