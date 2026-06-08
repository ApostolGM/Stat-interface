// tags-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToTags(callback) {
    const docRef = doc(db, "config", "tags");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().tags || []);
        } else {
            const defaultTags = [
                { id: "weapon", name: "Оружие", color: "#FF4444" },
                { id: "armor", name: "Броня", color: "#4444FF" },
                { id: "med", name: "Медицина", color: "#44FF44" },
                { id: "food", name: "Еда", color: "#FFAA44" },
                { id: "ammo", name: "Патроны", color: "#FF8844" },
                { id: "common", name: "Обычное", color: "#AAAAAA" },
                { id: "rare", name: "Редкое", color: "#4488FF" },
                { id: "legendary", name: "Легендарное", color: "#FFAA00" },
                { id: "bestiary", name: "Бестиарий", color: "#FF44FF" },
                { id: "unique", name: "Уникальное", color: "#FF4488" }
            ];
            setDoc(docRef, { tags: defaultTags });
            callback(defaultTags);
        }
    });
}

export async function updateTags(tags) {
    const docRef = doc(db, "config", "tags");
    await setDoc(docRef, { tags });
}
