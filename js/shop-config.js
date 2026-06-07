// shop-config.js
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Получить категории и товары
export function subscribeToShop(callback) {
    const shopDocRef = doc(db, "config", "shop");
    return onSnapshot(shopDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback(data.categories || {});
        } else {
            // Категории по умолчанию
            const defaultCategories = {
                "Еда": [
                    { id: 'water', name: 'Фляга с водой', emoji: '💧', price: 1 },
                    { id: 'tushonka', name: 'Тушенка', emoji: '🥫', price: 2 }
                ],
                "Медицина": [
                    { id: 'medkit', name: 'Аптечка', emoji: '🏥', price: 2 },
                    { id: 'bandage', name: 'Бинт стерильный', emoji: '🩹', price: 1 }
                ],
                "Снаряжение": [
                    { id: 'battery', name: 'Батарея', emoji: '🔋', price: 1 },
                    { id: 'patrons', name: 'Патроны (10 шт.)', emoji: '🔫', price: 1 }
                ]
            };
            setDoc(shopDocRef, { categories: defaultCategories });
            callback(defaultCategories);
        }
    });
}

// Обновить категории
export async function updateShopCategories(categories) {
    const shopDocRef = doc(db, "config", "shop");
    await setDoc(shopDocRef, { categories });
}
