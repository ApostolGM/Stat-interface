// shop-config.js
import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Структура: { категория: { subcategories: { подкатегория: [ items ] } } }
// Пример:
// {
//   "Оружие": {
//     subcategories: {
//       "Пистолеты": [
//         { id: "1", name: "ПМ", image: "pm.png", price: 10, tags: ["начальное", "лёгкое"] }
//       ]
//     }
//   }
// }

export function subscribeToShop(callback) {
    const shopDocRef = doc(db, "config", "shop");
    return onSnapshot(shopDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().categories || {});
        } else {
            const defaultCategories = {
                "Оружие": {
                    subcategories: {
                        "Пистолеты": [
                            { id: "pm", name: "ПМ", image: "", price: 5, tags: ["начальное"] },
                            { id: "glock", name: "Глок-17", image: "", price: 15, tags: ["редкое"] }
                        ],
                        "Винтовки": [
                            { id: "ak", name: "АК-47", image: "", price: 25, tags: ["штурмовое"] }
                        ]
                    }
                },
                "Медицина": {
                    subcategories: {
                        "Аптечки": [
                            { id: "medkit", name: "Малая аптечка", image: "", price: 3, tags: ["расходник"] },
                            { id: "bigmedkit", name: "Большая аптечка", image: "", price: 8, tags: ["редкое"] }
                        ]
                    }
                }
            };
            setDoc(shopDocRef, { categories: defaultCategories });
            callback(defaultCategories);
        }
    });
}

export async function updateShopCategories(categories) {
    const shopDocRef = doc(db, "config", "shop");
    await setDoc(shopDocRef, { categories });
}
