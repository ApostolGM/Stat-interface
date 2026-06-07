// Глобальные переменные
let shopItems = {};               // товары, сгруппированные по категориям
let groupSettings = {};           // индексы цен
let currentInventory = [];        // инвентарь текущего игрока
let state = {
  tokens: 0,
  currentMainTab: 'shop',
  currentSubTab: 'food',
  soundEnabled: false
};

// Загрузка всех данных
async function loadAppData() {
  try {
    // Статичный список товаров
    const resp = await fetch('data/shop-data.json');
    const staticData = await resp.json();
    shopItems = {};
    staticData.items.forEach(item => {
      if (!shopItems[item.category]) shopItems[item.category] = [];
      shopItems[item.category].push(item);
    });

    // Настройки группы
    const groupDoc = await db.collection('groups').doc(currentGroupId).get();
    groupSettings = groupDoc.data().settings;

    // Данные пользователя
    const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
    state.tokens = userDoc.data().tokens || 0;

    // Инвентарь
    const invDoc = await db.collection('inventories').doc(auth.currentUser.uid).get();
    currentInventory = invDoc.exists ? invDoc.data().items : [];

    applyPrices();
    showScreen('app-screen');
    setupTabs();
    renderAll();

    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    document.getElementById('adminLink').addEventListener('click', () => {
      if (userRole === 'master') renderAdminScreen();
      else alert('Только мастер может войти в админ-панель');
    });
  } catch (e) {
    console.error(e);
  }
}

// Применить индексы к ценам
function applyPrices() {
  for (let cat in shopItems) {
    shopItems[cat] = shopItems[cat].map(item => ({
      ...item,
      displayPrice: Math.round(item.price * (groupSettings.globalIndex || 1) * (groupSettings.categoryIndexes[cat] || 1))
    }));
  }
}

// Покупка товара
async function buyItem(item) {
  const userRef = db.collection('users').doc(auth.currentUser.uid);
  const invRef = db.collection('inventories').doc(auth.currentUser.uid);
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const tokens = userDoc.data().tokens || 0;
      if (tokens < item.displayPrice) throw new Error('Недостаточно РК');
      transaction.update(userRef, { tokens: tokens - item.displayPrice });
      const invDoc = await transaction.get(invRef);
      const items = invDoc.exists ? invDoc.data().items : [];
      const existing = items.find(i => i.name === item.name);
      if (existing) existing.quantity++;
      else items.push({ name: item.name, quantity: 1 });
      transaction.set(invRef, { items }, { merge: true });
    });
    // Обновить локальное состояние
    state.tokens -= item.displayPrice;
    const existing = currentInventory.find(i => i.name === item.name);
    if (existing) existing.quantity++;
    else currentInventory.push({ name: item.name, quantity: 1 });
    updateBalance();
    renderAll();
  } catch (e) {
    alert(e.message);
  }
}

// Открытие лутбокса
async function openLootbox(boxId) {
  const box = shopItems.lootboxes.find(b => b.id === boxId);
  if (!box || box.displayPrice > state.tokens) return;
  const result = rollLoot(boxId); // функция rollLoot остаётся в app.js
  const userRef = db.collection('users').doc(auth.currentUser.uid);
  const invRef = db.collection('inventories').doc(auth.currentUser.uid);
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const tokens = userDoc.data().tokens || 0;
      if (tokens < box.displayPrice) throw new Error('Недостаточно РК');
      transaction.update(userRef, { tokens: tokens - box.displayPrice });
      const invDoc = await transaction.get(invRef);
      const items = invDoc.exists ? invDoc.data().items : [];
      const existing = items.find(i => i.name === result.name);
      if (existing) existing.quantity++;
      else items.push({ name: result.name, quantity: 1 });
      transaction.set(invRef, { items }, { merge: true });
    });
    state.tokens -= box.displayPrice;
    const existing = currentInventory.find(i => i.name === result.name);
    if (existing) existing.quantity++;
    else currentInventory.push({ name: result.name, quantity: 1 });
    updateBalance();
    // Показать результат
    document.getElementById(`result-${boxId}`).innerHTML = 
      `<span style="color:var(--accent);">${result.name}</span> <small>[${result.rarity}]</small>`;
    renderAll();
  } catch (e) {
    alert(e.message);
  }
}

// ... (renderShop, createItemCard, renderInventory, setupTabs, updateBalance и т.д.)
// Полный код я могу предоставить отдельно, но суть ясна.
