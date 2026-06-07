const MASTER_KEY = 'ApS-AMJ-N'; // тот самый ключ

document.getElementById('create-group-btn').addEventListener('click', async () => {
  const name = document.getElementById('group-name').value.trim();
  const key = document.getElementById('master-key').value.trim();
  const error = document.getElementById('group-error');
  if (!name) return error.textContent = 'Введите название';
  if (key !== MASTER_KEY) return error.textContent = 'Неверный ключ мастера';
  try {
    const user = auth.currentUser;
    const groupRef = db.collection('groups').doc();
    await groupRef.set({
      name,
      masterUid: user.uid,
      settings: {
        globalIndex: 1.0,
        categoryIndexes: { food: 1.0, weapons: 1.0, bestiary: 1.0, lootboxes: 1.0 }
      },
      players: [user.uid]
    });
    // Обновляем пользователя
    await db.collection('users').doc(user.uid).update({
      groupId: groupRef.id,
      role: 'master'
    });
    // Создаём пустой инвентарь
    await db.collection('inventories').doc(user.uid).set({ items: [] });
    // Запускаем терминал
    window.currentGroupId = groupRef.id;
    window.userRole = 'master';
    loadAppData();
  } catch (e) {
    error.textContent = e.message;
  }
});

document.getElementById('join-group-btn').addEventListener('click', async () => {
  const groupId = document.getElementById('join-group-id').value.trim();
  const error = document.getElementById('group-error');
  if (!groupId) return error.textContent = 'Введите ID группы';
  try {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) return error.textContent = 'Группа не найдена';
    const user = auth.currentUser;
    // Добавляем игрока в группу
    await groupDoc.ref.update({
      players: firebase.firestore.FieldValue.arrayUnion(user.uid)
    });
    await db.collection('users').doc(user.uid).update({
      groupId,
      role: 'player'
    });
    await db.collection('inventories').doc(user.uid).set({ items: [] });
    window.currentGroupId = groupId;
    window.userRole = 'player';
    loadAppData();
  } catch (e) {
    error.textContent = e.message;
  }
});
