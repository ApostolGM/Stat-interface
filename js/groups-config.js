// groups-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToGroups(callback) {
    const docRef = doc(db, "config", "groups");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) callback(docSnap.data().groups || []);
        else { setDoc(docRef, { groups: [] }); callback([]); }
    });
}

export async function updateGroups(groups) {
    const docRef = doc(db, "config", "groups");
    await setDoc(docRef, { groups });
}

export async function updateGroupData(groupId, data) {
    const docRef = doc(db, "config", "groups");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        const allGroups = snapshot.data().groups || [];
        const updatedGroups = allGroups.map(g => g.id === groupId ? { ...g, ...data } : g);
        await setDoc(docRef, { groups: updatedGroups });
    }
}

// Новая функция: создать группу со всеми полями
export async function createGroup(name, notes = '') {
    const newGroup = {
        id: 'group_' + Date.now(),
        name,
        notes,
        players: [],
        applications: [],
        baseInventory: [],
        bestiary: [],
        shop: { categories: {} },        // ← важно!
        lootboxes: [],                   // ← важно!
        events: null                     // ← важно!
    };
    const docRef = doc(db, "config", "groups");
    const snapshot = await getDoc(docRef);
    const groups = snapshot.exists() ? (snapshot.data().groups || []) : [];
    groups.push(newGroup);
    await setDoc(docRef, { groups });
    return newGroup;
}
