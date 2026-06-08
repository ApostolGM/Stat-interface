// auth.js
import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { subscribeToGroups, updateGroups } from './groups-config.js';

const FAKE_DOMAIN = "@gephard.local";

function loginToEmail(login) { return login.trim().toLowerCase() + FAKE_DOMAIN; }
function emailToLogin(email) { return email ? email.replace(FAKE_DOMAIN, '') : ''; }

export let currentUser = null;

export async function signUp() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    if (!login) { errorEl.innerText = 'ВВЕДИТЕ ЛОГИН'; return; }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, loginToEmail(login), password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            login,
            email: loginToEmail(login),
            tokens: 5,
            characterIds: []
        });
    } catch (error) { errorEl.innerText = error.message; }
}

export async function signIn() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    if (!login) { errorEl.innerText = 'ВВЕДИТЕ ЛОГИН'; return; }
    try {
        await signInWithEmailAndPassword(auth, loginToEmail(login), password);
    } catch (error) { errorEl.innerText = error.message; }
}

export async function signOutUser() {
    await signOut(auth);
}

export function setupAuth(onUserChange) {
    onAuthStateChanged(auth, async (user) => {
        document.getElementById('loading').classList.add('hidden');
        if (user) {
            currentUser = user;
            document.getElementById('auth').classList.add('hidden');
            document.getElementById('userInfo')?.classList.add('hidden');
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                onUserChange({ ...data, uid: user.uid });
                showCharacterScreen({ ...data, uid: user.uid });
            } else {
                onUserChange(null);
            }
        } else {
            currentUser = null;
            document.getElementById('auth').classList.remove('hidden');
            document.getElementById('characterScreen').classList.add('hidden');
            document.getElementById('terminal').classList.add('hidden');
            onUserChange(null);
        }
    });
}

export async function showCharacterScreen(userData) {
    document.getElementById('auth').classList.add('hidden');
    document.getElementById('characterScreen').classList.remove('hidden');
    document.getElementById('terminal').classList.add('hidden');
    
    const container = document.getElementById('characterContent');
    const characterIds = userData.characterIds || [];
    
    let html = '<h2>ВАШИ ПЕРСОНАЖИ</h2>';
    
    if (characterIds.length === 0) {
        html += '<p>НЕТ ПЕРСОНАЖЕЙ</p>';
    } else {
        html += '<div style="display:flex; flex-direction:column; gap:8px;">';
        for (const charId of characterIds) {
            const charDoc = await getDoc(doc(db, "characters", charId));
            if (charDoc.exists()) {
                const char = charDoc.data();
                html += `<button class="select-char-btn" data-id="${charId}">${char.name} (${char.groupId ? 'В ГРУППЕ' : 'БЕЗ ГРУППЫ'})</button>`;
            }
        }
        html += '</div>';
    }
    
    html += '<button id="createApplicationBtn" style="margin-top:15px;">СОЗДАТЬ ЗАЯВКУ</button>';
    container.innerHTML = html;

    // Обработчики выбора персонажа
    document.querySelectorAll('.select-char-btn').forEach(btn => {
        btn.onclick = async () => {
            const charDoc = await getDoc(doc(db, "characters", btn.dataset.id));
            if (charDoc.exists() && charDoc.data().groupId) {
                window.selectedCharacter = { id: btn.dataset.id, ...charDoc.data() };
                document.getElementById('characterScreen').classList.add('hidden');
                document.getElementById('terminal').classList.remove('hidden');
                window.dispatchEvent(new CustomEvent('characterSelected', { detail: window.selectedCharacter }));
            } else {
                alert('ПЕРСОНАЖ НЕ ПРИНЯТ В ГРУППУ');
            }
        };
    });

    // Кнопка создания заявки
    document.getElementById('createApplicationBtn').onclick = () => showApplicationForm(userData);

    // Показываем мастер-панель, если пользователь — мастер
    const { isMaster } = await import('./admin.js');
    const masterPanel = document.getElementById('masterPanel');
    const enterAdminBtn = document.getElementById('enterAdminFromCharBtn');
    
    if (isMaster(userData.uid)) {
        masterPanel.style.display = 'block';
        enterAdminBtn.onclick = () => {
            window.selectedCharacter = null;
            document.getElementById('characterScreen').classList.add('hidden');
            document.getElementById('terminal').classList.remove('hidden');
            window.dispatchEvent(new CustomEvent('characterSelected', { detail: null }));
        };
    } else {
        masterPanel.style.display = 'none';
    }
}

async function showApplicationForm(userData) {
    const container = document.getElementById('characterContent');
    container.innerHTML = `
        <h3>НОВАЯ ЗАЯВКА</h3>
        <input type="text" id="charName" placeholder="ИМЯ ПЕРСОНАЖА">
        <select id="groupSelect"><option value="">ВЫБЕРИТЕ ГРУППУ</option></select>
        <button id="submitApplicationBtn">ОТПРАВИТЬ</button>
        <button id="cancelApplicationBtn">ОТМЕНА</button>
    `;
    
    // Загружаем список групп
    subscribeToGroups(groups => {
        const select = document.getElementById('groupSelect');
        if (!select) return;
        select.innerHTML = '<option value="">ВЫБЕРИТЕ ГРУППУ</option>';
        groups.forEach(g => select.innerHTML += `<option value="${g.id}">${g.name}</option>`);
    });

    document.getElementById('submitApplicationBtn').onclick = async () => {
        const name = document.getElementById('charName').value.trim();
        const groupId = document.getElementById('groupSelect').value;
        if (!name || !groupId) return;
        
        const charId = 'char_' + Date.now();
        await setDoc(doc(db, "characters", charId), {
            id: charId,
            name,
            userId: userData.uid,
            groupId: null,
            inventory: []
        });
        
        await updateDoc(doc(db, "users", userData.uid), {
            characterIds: [...(userData.characterIds || []), charId]
        });
        
        // Добавляем заявку в группу
        const groups = await new Promise(resolve => {
            let unsub = subscribeToGroups(g => { resolve(g); unsub(); });
        });
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.applications = group.applications || [];
            group.applications.push({
                characterId: charId,
                characterName: name,
                userId: userData.uid
            });
            await updateGroups(groups);
            alert('ЗАЯВКА ОТПРАВЛЕНА');
            showCharacterScreen(userData);
        }
    };
    
    document.getElementById('cancelApplicationBtn').onclick = () => showCharacterScreen(userData);
}
