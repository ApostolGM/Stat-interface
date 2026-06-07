// db.js
import { db } from './firebase-config.js';
import { doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToUserData(userId, callback) {
    const userDocRef = doc(db, "users", userId);
    return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback({
                tokens: data.tokens || 0,
                inventory: data.inventory || []
            });
        }
    });
}

export async function updateUserData(userId, data) {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, data);
}
