// items-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function subscribeToItems(callback) {
    const docRef = doc(db, "config", "items");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().items || []);
        } else {
            const defaultItems = [
                { id: "item_water", name: "Фляга с водой", description: "", image: "", tags: ["food"], basePrice: 1 },
                { id: "item_medkit", name: "Аптечка малая", description: "Восстанавливает здоровье", image: "", tags: ["med", "common"], basePrice: 3 },
                { id: "item_pm", name: "ПМ", description: "Пистолет Макарова", image: "", tags: ["weapon", "common"], basePrice: 5, baseDurability: 100 },
                { id: "item_bandage", name: "Бинт стерильный", description: "", image: "", tags: ["med", "common"], basePrice: 1 }
            ];
            setDoc(docRef, { items: defaultItems });
            callback(defaultItems);
        }
    });
}

export async function updateItems(items) {
    const docRef = doc(db, "config", "items");
    await setDoc(docRef, { items });
}
