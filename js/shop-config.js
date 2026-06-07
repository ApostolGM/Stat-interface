// shop-config.js
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Получить текущие товары
export function subscribeToShop(callback) {
    const shopDocRef = doc(db, "config", "shop");
    return onSnapshot(shopDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().items || []);
        } else {
            // Если документа нет, создаём с товарами по умолчанию
            const defaultItems = [
                { id: 'patrons', name: 'ПАТРОНЫ', emoji: '🔫', price: 1 },
                { id: 'medkit', name: 'АПТЕЧКА', emoji: '🏥', price: 2 },
                { id: 'battery', name: 'БАТАРЕЯ', emoji: '🔋', price: 1 },
                { id: 'water', name: 'ВОДА', emoji: '💧', price: 1 }
            ];
            setDoc(shopDocRef, { items: defaultItems });
            callback(defaultItems);
        }
    });
}

// Обновить товары
export async function updateShopItems(items) {
    const shopDocRef = doc(db, "config", "shop");
    await setDoc(shopDocRef, { items });
}
