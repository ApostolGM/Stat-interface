async function renderAdminScreen() {
  const app = document.getElementById('app-screen');
  app.innerHTML = `
    <div class="terminal">
      <div class="header">
        <h1>APOSTOL — АДМИН</h1>
        <button id="back-btn" class="sound-btn">← Назад</button>
      </div>
      <div class="admin-panel">
        <h2>Индексы цен</h2>
        <div class="admin-row">
          <label>Общий: <input type="number" id="globalIndex" value="${groupSettings.globalIndex}" step="0.1"></label>
        </div>
        ${Object.keys(groupSettings.categoryIndexes).map(cat => `
          <div class="admin-row">
            <label>${cat}: <input type="number" class="cat-index" data-cat="${cat}" value="${groupSettings.categoryIndexes[cat]}" step="0.1"></label>
          </div>
        `).join('')}
        <button id="apply-settings">Применить</button>
        <hr>
        <h2>Игроки группы</h2>
        <div id="players-list"></div>
      </div>
    </div>
  `;
  document.getElementById('back-btn').addEventListener('click', () => loadAppData());
  document.getElementById('apply-settings').addEventListener('click', applySettings);
  loadPlayersList();
}

async function applySettings() {
  const globalIndex = parseFloat(document.getElementById('globalIndex').value);
  const categoryIndexes = {};
  document.querySelectorAll('.cat-index').forEach(input => {
    categoryIndexes[input.dataset.cat] = parseFloat(input.value);
  });
  await db.collection('groups').doc(currentGroupId).update({
    settings: { globalIndex, categoryIndexes }
  });
  groupSettings = { globalIndex, categoryIndexes };
  applyPrices();
  alert('Индексы обновлены');
}

async function loadPlayersList() {
  const groupDoc = await db.collection('groups').doc(currentGroupId).get();
  const players = groupDoc.data().players;
  const list = document.getElementById('players-list');
  list.innerHTML = '';
  for (const uid of players) {
    const userDoc = await db.collection('users').doc(uid).get();
    const invDoc = await db.collection('inventories').doc(uid).get();
    const tokens = userDoc.data().tokens;
    const inv = invDoc.exists ? invDoc.data().items : [];
    const div = document.createElement('div');
    div.className = 'admin-item';
    div.innerHTML = `<strong>${userDoc.data().email}</strong> — ${tokens} РК — Предметов: ${inv.length}`;
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => showPlayerDetails(uid));
    list.appendChild(div);
  }
}

function showPlayerDetails(uid) {
  // Можно открыть подробный просмотр с возможностью редактирования инвентаря
  // Реализуешь по желанию
}
