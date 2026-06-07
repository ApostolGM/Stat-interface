let shopItems = {}; // загружается из shop-data.json
let groupSettings = {};
let currentInventory = [];

// Загрузка данных группы и товаров
async function loadAppData() {
  // Загружаем статичный список товаров
  const resp = await fetch('data/shop-data.json');
  const staticData = await resp.json();
  // Преобразуем в структуру по категориям
  shopItems = {};
  staticData.items.forEach(item => {
    if (!shopItems[item.category]) shopItems[item.category] = [];
    shopItems[item.category].push(item);
  });

  // Загружаем настройки группы
  const groupDoc = await db.collection('groups').doc(currentGroupId).get();
  groupSettings = groupDoc.data().settings;

  // Загружаем инвентарь пользователя
  const invDoc = await db.collection('inventories').doc(auth.currentUser.uid).get();
  currentInventory = invDoc.exists ? invDoc.data().items : [];

  // Пересчитываем цены
  applyPrices();

  // Показываем экран терминала
  showScreen('app-screen');
  // Рендерим магазин по умолчанию
  state.currentSubTab = 'food';
  renderAll();

  // Инициализируем вкладки (повторно, т.к. DOM обновился)
  setupTabs();
  document.getElementById('soundToggle').addEventListener('click', toggleSound);
  document.getElementById('adminLink').addEventListener('click', () => {
    if (userRole === 'master') renderAdminScreen();
    else alert('Только мастер может войти в админ-панель');
  });
}

// Применение индексов к ценам
function applyPrices() {
  for (let cat in shopItems) {
    shopItems[cat] = shopItems[cat].map(item => ({
      ...item,
      displayPrice: Math.round(item.price * (groupSettings.globalIndex || 1) * (groupSettings.categoryIndexes[cat] || 1))
    }));
  }
}

// ... (дальше функции renderShop, createItemCard, renderInventory и т.д. как раньше,
// но используют shopItems и displayPrice)
// В renderInventory показываем currentInventory (массив {name, quantity})

// Состояние (state) остаётся похожим: tokens (баланс) теперь можно хранить в Firestore?
// Пока оставим в памяти, но при обновлении инвентаря синхронизируем с Firestore.
// Функции покупки и открытия лутбокса будут обновлять Firestore инвентарь и баланс (позже).
