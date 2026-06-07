// ==================== АДМИН-ПАНЕЛЬ ====================

// Ключ для localStorage
const ADMIN_STORAGE_KEY = 'apostol_admin_data';

// Загружаем данные (из localStorage или из JSON по умолчанию)
let adminData = {};

async function loadAdminData() {
    // Пытаемся загрузить сохранённые данные
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
        adminData = JSON.parse(saved);
        return;
    }
    // Иначе загружаем из JSON-файла (при первом запуске)
    try {
        const resp = await fetch('data/shop-data.json');
        adminData = await resp.json();
        saveAdminData();
    } catch (e) {
        console.error('Не удалось загрузить shop-data.json, используются пустые данные');
        adminData = { globalIndex: 1.0, categoryIndexes: {}, items: {} };
    }
}

function saveAdminData() {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
}

// Рассчитываем цену с учётом индексов
function getFinalPrice(basePrice, category) {
    const global = adminData.globalIndex || 1;
    const catIdx = (adminData.categoryIndexes && adminData.categoryIndexes[category]) || 1;
    return Math.round(basePrice * global * catIdx);
}

// Обновить отображение цен во всём интерфейсе (используется в app.js)
function applyPricesToItems() {
    for (let cat in shopItems) {
        shopItems[cat] = shopItems[cat].map(item => ({
            ...item,
            displayPrice: getFinalPrice(item.price, cat)
        }));
    }
}

// ==================== РЕНДЕР АДМИН-ПАНЕЛИ ====================
function renderAdminScreen() {
    const app = document.getElementById('appScreen');
    if (!app) return;
    app.innerHTML = `
        <div class="header">
            <h1>APOSTOL — АДМИН</h1>
            <button id="logoutAdmin" class="sound-btn">Выйти</button>
        </div>
        <div class="admin-panel">
            <h2>Индексы цен</h2>
            <div class="admin-row">
                <label>Общий индекс: <input type="number" id="globalIndex" value="${adminData.globalIndex}" step="0.1" min="0.1"></label>
            </div>
            <div class="admin-row">
                ${Object.keys(adminData.categoryIndexes).map(cat => `
                    <label>${cat}: <input type="number" class="cat-index" data-cat="${cat}" value="${adminData.categoryIndexes[cat]}" step="0.1" min="0.1"></label>
                `).join('')}
            </div>
            <button id="applyIndexes">Применить индексы</button>
            <hr>
            <h2>Товары</h2>
            <div id="adminItems"></div>
            <button id="addItem">Добавить товар</button>
            <hr>
            <button id="exportJson">Экспорт shop-data.json</button>
            <p class="hint">После экспорта загрузите файл в репозиторий на GitHub.</p>
        </div>
    `;

    renderAdminItems();
    document.getElementById('logoutAdmin').addEventListener('click', logoutAdmin);
    document.getElementById('applyIndexes').addEventListener('click', applyIndexes);
    document.getElementById('addItem').addEventListener('click', addItem);
    document.getElementById('exportJson').addEventListener('click', exportJson);
}

function renderAdminItems() {
    const container = document.getElementById('adminItems');
    if (!container) return;
    let html = '';
    for (let cat in adminData.items) {
        html += `<h3>${cat}</h3>`;
        adminData.items[cat].forEach((item, idx) => {
            html += `
                <div class="admin-item" data-cat="${cat}" data-idx="${idx}">
                    <input type="text" class="item-name" value="${item.name}">
                    <input type="text" class="item-desc" value="${item.desc}">
                    <input type="number" class="item-price" value="${item.price}" step="1">
                    <input type="text" class="item-image" value="${item.image || ''}" placeholder="URL картинки">
                    <button class="delete-item">Удалить</button>
                </div>
            `;
        });
    }
    container.innerHTML = html;

    // Обработчики удаления
    container.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemDiv = e.target.closest('.admin-item');
            const cat = itemDiv.dataset.cat;
            const idx = parseInt(itemDiv.dataset.idx);
            adminData.items[cat].splice(idx, 1);
            saveAdminData();
            renderAdminItems();
        });
    });

    // Сохранение при изменении полей
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
            saveItemChanges();
        });
    });
}

function saveItemChanges() {
    document.querySelectorAll('.admin-item').forEach(div => {
        const cat = div.dataset.cat;
        const idx = parseInt(div.dataset.idx);
        if (adminData.items[cat] && adminData.items[cat][idx]) {
            const item = adminData.items[cat][idx];
            item.name = div.querySelector('.item-name').value;
            item.desc = div.querySelector('.item-desc').value;
            item.price = parseInt(div.querySelector('.item-price').value) || 0;
            item.image = div.querySelector('.item-image').value;
        }
    });
    saveAdminData();
    applyPricesToItems();
}

function applyIndexes() {
    adminData.globalIndex = parseFloat(document.getElementById('globalIndex').value) || 1.0;
    document.querySelectorAll('.cat-index').forEach(input => {
        const cat = input.dataset.cat;
        adminData.categoryIndexes[cat] = parseFloat(input.value) || 1.0;
    });
    saveAdminData();
    applyPricesToItems();
    alert('Индексы применены. Цены обновятся в интерфейсе.');
}

function addItem() {
    const cat = prompt('Введите категорию (food, weapons, bestiary, lootboxes):');
    if (!cat || !adminData.items[cat]) return;
    const newItem = {
        id: 'item_' + Date.now(),
        name: 'Новый товар',
        desc: '',
        price: 1,
        image: ''
    };
    adminData.items[cat].push(newItem);
    saveAdminData();
    renderAdminItems();
}

function exportJson() {
    saveItemChanges(); // на всякий случай
    const blob = new Blob([JSON.stringify(adminData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shop-data.json';
    a.click();
    URL.revokeObjectURL(url);
}

function logoutAdmin() {
    state.isAdmin = false;
    renderApp();
}

// При входе под мастером вызываем renderAdminScreen
// (интеграция в app.js описана ниже)
