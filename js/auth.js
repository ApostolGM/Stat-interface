// auth.js
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const FAKE_DOMAIN = "@gephard.local";
let currentUser = null;

function loginToEmail(login) {
    return login.trim().toLowerCase() + FAKE_DOMAIN;
}

function emailToLogin(email) {
    return email.replace(FAKE_DOMAIN, '');
}

export async function signUp() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    if (!login) {
        errorEl.innerText = 'ВВЕДИТЕ ЛОГИН';
        return;
    }
    const email = loginToEmail(login);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            tokens: 5, // стартовый баланс
            login: login,
            email: email,
            characters: []
        });
    } catch (error) {
        errorEl.innerText = error.message;
    }
}

export async function signIn() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    if (!login) {
        errorEl.innerText = 'ВВЕДИТЕ ЛОГИН';
        return;
    }
    const email = loginToEmail(login);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errorEl.innerText = error.message;
    }
}

export async function signOutUser() {
    await signOut(auth);
}

// Показываем экран выбора персонажа или создания заявки
function showCharacterScreen(user) {
    document.getElementById('auth').classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    const charScreen = document.getElementById('characterScreen');
    charScreen.classList.remove('hidden');
    renderCharacterScreen(user);
}

export function setupAuth(onUserChange) {
    onAuthStateChanged(auth, (user) => {
        document.getElementById('loading').classList.add('hidden');
        if (user) {
            currentUser = user;
            document.getElementById('auth').classList.add('hidden');
            document.getElementById('userInfo').classList.add('hidden');
            // Загружаем данные пользователя для получения персонажей
            getDoc(doc(db, "users", user.uid)).then(userDoc => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    onUserChange({ ...userData, uid: user.uid });
                    showCharacterScreen({ ...userData, uid: user.uid });
                } else {
                    // Если документ не найден (редкий случай)
                    onUserChange(null);
                }
            });
        } else {
            currentUser = null;
            document.getElementById('auth').classList.remove('hidden');
            document.getElementById('characterScreen').classList.add('hidden');
            document.getElementById('terminal').classList.add('hidden');
            onUserChange(null);
        }
    });
}

// Рендер экрана персонажей
async function renderCharacterScreen(userData) {
    const container = document.getElementById('characterContent');
    const characters = userData.characters || [];
    let html = '<h2>ВАШИ ПЕРСОНАЖИ</h2>';
    if (characters.length === 0) {
        html += '<p>У ВАС НЕТ ПЕРСОНАЖЕЙ. СОЗДАЙТЕ ЗАЯВКУ.</p>';
    } else {
        html += '<div style="display:flex; flex-direction:column; gap:8px;">';
        characters.forEach(char => {
            html += `<button class="select-char-btn" data-id="${char.id}">${char.name} (${char.groupId ? 'в группе' : 'без группы'})</button>`;
        });
        html += '</div>';
    }
    html += '<button id="createApplicationBtn" style="margin-top:15px;">СОЗДАТЬ ЗАЯВКУ</button>';
    container.innerHTML = html;

    // Обработчики
    document.querySelectorAll('.select-char-btn').forEach(btn => {
        btn.onclick = () => {
            const charId = btn.dataset.id;
            const char = characters.find(c => c.id === charId);
            if (char && char.groupId) {
                // Загружаем группу и переходим в терминал
                window.selectedCharacter = char;
                document.getElementById('characterScreen').classList.add('hidden');
                document.getElementById('terminal').classList.remove('hidden');
                window.dispatchEvent(new CustomEvent('characterSelected', { detail: char }));
            } else {
                alert('Этот персонаж ещё не принят в группу.');
            }
        };
    });

    document.getElementById('createApplicationBtn').onclick = () => showApplicationForm(userData);
}

// Форма создания заявки
function showApplicationForm(userData) {
    const container = document.getElementById('characterContent');
    container.innerHTML = `
        <h3>НОВАЯ ЗАЯВКА</h3>
        <input type="text" id="charName" placeholder="ИМЯ ПЕРСОНАЖА">
        <select id="groupSelect">
            <option value="">ВЫБЕРИТЕ ГРУППУ</option>
        </select>
        <button id="submitApplicationBtn">ОТПРАВИТЬ</button>
        <button id="cancelApplicationBtn">ОТМЕНА</button>
    `;
    // Загружаем список групп для выбора
    import('./groups-config.js').then(module => {
        module.subscribeToGroups(groups => {
            const select = document.getElementById('groupSelect');
            if (!select) return;
            select.innerHTML = '<option value="">ВЫБЕРИТЕ ГРУППУ</option>';
            groups.forEach(g => {
                select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
            });
        });
    });

    document.getElementById('submitApplicationBtn').onclick = async () => {
        const name = document.getElementById('charName').value.trim();
        const groupId = document.getElementById('groupSelect').value;
        if (!name || !groupId) return alert('Заполните все поля');
        const charId = 'char_' + Date.now();
        const newChar = { id: charId, name, groupId: null, inventory: [] };
        const updatedChars = [...(userData.characters || []), newChar];
        await updateDoc(doc(db, "users", userData.uid), { characters: updatedChars });

        // Добавляем заявку в группу
        import('./groups-config.js').then(async module => {
            const groups = await new Promise(resolve => {
                module.subscribeToGroups(resolve);
            });
            const group = groups.find(g => g.id === groupId);
            if (group) {
                const applications = group.applications || [];
                applications.push({ characterId: charId, characterName: name, userId: userData.uid });
                const updatedGroup = { ...group, applications };
                const newGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
                await module.updateGroups(newGroups);
                alert('Заявка отправлена!');
                // Обновляем экран
                const userDoc = await getDoc(doc(db, "users", userData.uid));
                renderCharacterScreen(userDoc.data());
            }
        });
    };

    document.getElementById('cancelApplicationBtn').onclick = () => renderCharacterScreen(userData);
}
