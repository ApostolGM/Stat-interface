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
