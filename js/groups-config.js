import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToGroups(callback) {
    const docRef = doc(db, "config", "groups");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) callback(docSnap.data().groups || []);
        else { setDoc(docRef, { groups: [] }); callback([]); }
    });
}

export async function updateGroups(groups) {
    await setDoc(doc(db, "config", "groups"), { groups });
}
