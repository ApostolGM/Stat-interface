// auth.js
import { auth, db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

let currentUser = null;

export async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            tokens: 3,
            inventory: [],
            email: email
        });
    } catch (error) {
        errorEl.innerText = error.message;
    }
}

export async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
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
        // Всегда скрываем загрузку и показываем экран авторизации
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('auth').classList.remove('hidden');

        if (user) {
            currentUser = user;
            document.getElementById('authForm').classList.add('hidden');
            document.getElementById('userInfo').classList.remove('hidden');
            document.getElementById('userEmail').innerText = user.email;
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
