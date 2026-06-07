// Переключение экранов
function showScreen(screenId) {
  document.querySelectorAll('.screen-container').forEach(div => div.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// Инициализация слушателя авторизации
auth.onAuthStateChanged(user => {
  if (user) {
    // Пользователь вошёл
    checkUserGroup(user);
  } else {
    showScreen('auth-screen');
  }
});

function checkUserGroup(user) {
  db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists && doc.data().groupId) {
      // Есть группа — запускаем терминал
      window.currentGroupId = doc.data().groupId;
      window.userRole = doc.data().role;
      loadAppData();
    } else {
      // Нет группы — показываем экран выбора
      showScreen('group-screen');
    }
  });
}

// Обработчики кнопок на auth-screen
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
      .catch(err => document.getElementById('auth-error').textContent = err.message);
  });
  document.getElementById('register-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        // Создаём документ пользователя в Firestore
        return db.collection('users').doc(cred.user.uid).set({
          email: cred.user.email,
          groupId: null,
          role: 'player'
        });
      })
      .catch(err => document.getElementById('auth-error').textContent = err.message);
  });
});

// Выход
function logout() {
  auth.signOut();
}
