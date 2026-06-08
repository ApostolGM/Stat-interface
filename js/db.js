// db.js
import { db } from './firebase-config.js';
import { doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { setCurrencies, setInventory } from './state.js';

export function subscribeToUserData(userId, callback) {
    const userDocRef = doc(db, "users", userId);
    return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrencies(data.currencies || { pink: 0, gray: 0, yellow: 0 });
            setInventory(data.inventory || []);
            if (callback) callback(data);
        }
    });
}

export async function updateUserData(userId, data) {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, data);
}
