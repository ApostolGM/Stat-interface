// helpers.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export async function findUserByLogin(login) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("login", "==", login));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

export async function getCharacterById(charId) {
    const docSnap = await getDoc(doc(db, "characters", charId));
    return docSnap.exists() ? { id: charId, ...docSnap.data() } : null;
}

export async function getUserById(userId) {
    const docSnap = await getDoc(doc(db, "users", userId));
    return docSnap.exists() ? { id: userId, ...docSnap.data() } : null;
}