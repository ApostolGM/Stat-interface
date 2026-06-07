// auth.js
import { auth, db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const FAKE_DOMAIN = "@gephard.local"; // фиктивный домен для логинов

let currentUser = null;

// Превращает логин в фиктивный email
function loginToEmail(login) {
    return login.trim().toLowerCase() + FAKE_DOMAIN;
}

// Извлекает логин из фиктивного email для отображения
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
            tokens: 3,
            inventory: [],
            login: login,      // сохраняем логин
            email: email       // сохраняем фиктивный email для поиска в админке
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

export function setupAuth(onUserChange) {
    onAuthStateChanged(auth, (user) => {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('auth').classList.remove('hidden');

        if (user) {
            currentUser = user;
            document.getElementById('authForm').classList.add('hidden');
            document.getElementById('userInfo').classList.remove('hidden');
            // Показываем логин вместо email
            const login = user.email ? emailToLogin(user.email) : user.email;
            document.getElementById('userEmail').innerText = login;
            onUserChange(user);
        } else {
            currentUser = null;
            document.getElementById('authForm').classList.remove('hidden');
            document.getElementById('userInfo').classList.add('hidden');
            document.getElementById('terminal').classList.add('hidden');
            onUserChange(null);
        }
    });
}
