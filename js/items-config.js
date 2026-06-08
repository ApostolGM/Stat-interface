import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToItems(callback) {
    const docRef = doc(db, "config", "items");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) callback(docSnap.data().items || []);
        else { setDoc(docRef, { items: [] }); callback([]); }
    });
}

export async function updateItems(items) {
    const docRef = doc(db, "config", "items");
    await setDoc(docRef, { items });
}