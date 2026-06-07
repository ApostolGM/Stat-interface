// groups-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Структура групп:
// [
//   {
//     id: "group_123",
//     name: "Сталкеры Кордона",
//     players: ["stalker_ivan", "newbie_olga"],  // логины игроков
//     notes: "Группа для основного сюжета. Ивану выдать артефакт."
//   }
// ]

export function subscribeToGroups(callback) {
    const docRef = doc(db, "config", "groups");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().groups || []);
        } else {
            setDoc(docRef, { groups: [] });
            callback([]);
        }
    });
}

export async function updateGroups(groups) {
    const docRef = doc(db, "config", "groups");
    await setDoc(docRef, { groups });
}
