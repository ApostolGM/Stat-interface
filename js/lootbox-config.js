// lootbox-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Получить все лутбоксы
export function subscribeToLootboxes(callback) {
    const docRef = doc(db, "config", "lootboxes");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().boxes || []);
        } else {
            // Лутбоксы по умолчанию
            const defaultBoxes = [
                {
                    id: "common_box",
                    name: "Гуманитарка",
                    image: "",
                    price: 1,
                    items: [
                        { name: "Банка тушенки", image: "", chance: 30 },
                        { name: "Фляга с водой", image: "", chance: 25 },
                        { name: "Бинт стерильный", image: "", chance: 20 },
                        { name: "Батарейки АА", image: "", chance: 15 },
                        { name: "Пачка галет", image: "", chance: 10 }
                    ]
                },
                {
                    id: "rare_box",
                    name: "Барахло-Х",
                    image: "",
                    price: 3,
                    items: [
                        { name: "Набор отмычек", image: "", chance: 20 },
                        { name: "Фонарь с динамо-машиной", image: "", chance: 15 },
                        { name: "Карта местности", image: "", chance: 15 },
                        { name: "Сигнальная ракетница", image: "", chance: 10 },
                        { name: "Универсальный глушитель", image: "", chance: 10 },
                        { name: "Доза антирадина", image: "", chance: 10 },
                        { name: "Банка тушенки", image: "", chance: 20 }
                    ]
                },
                {
                    id: "legendary_box",
                    name: "Специалист",
                    image: "",
                    price: 5,
                    items: [
                        { name: "Портативный очиститель воды", image: "", chance: 15 },
                        { name: "Генератор белого шума", image: "", chance: 12 },
                        { name: "Силовая батарея МП-8", image: "", chance: 10 },
                        { name: "Имплант «Зоркий глаз»", image: "", chance: 8 },
                        { name: "Чертёж экзоскелета", image: "", chance: 5 },
                        { name: "Ключ-пропуск в Убежище 17", image: "", chance: 10 },
                        { name: "Набор отмычек", image: "", chance: 20 },
                        { name: "Доза антирадина", image: "", chance: 20 }
                    ]
                }
            ];
            setDoc(docRef, { boxes: defaultBoxes });
            callback(defaultBoxes);
        }
    });
}

// Обновить лутбоксы
export async function updateLootboxes(boxes) {
    const docRef = doc(db, "config", "lootboxes");
    await setDoc(docRef, { boxes });
}
