// admin.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { log } from './shared.js';
import { subscribeToShop, updateShopCategories } from './shop-config.js';
import { subscribeToLootboxes, updateLootboxes } from './lootbox-config.js';
import { renderGroupsAdmin, initGroups } from './groups.js';

const MASTER_UIDS = ["твой-uid-здесь"];

let currentUser = null;
// Отслеживаем пользователя
onAuthStateChanged(auth, (user) => { currentUser = user; });

let foundUserId = null;
let foundUserData = null;
let shopCategories = {};
let lootboxesCache = [];
let adminMode = 'players';
let selectedCategory = null;
let selectedSubcategory = null;

export function isMaster(uid) {
    return MASTER_UIDS.includes(uid);
}

export function resetAdmin() {
    foundUserId = null;
    foundUserData = null;
    adminMode = 'players';
    selectedCategory = null;
    selectedSubcategory = null;
}

export async function findUserByLogin(login) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("login", "==", login));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

export async function renderAdmin() {
    const container = document.getElementById('adminContent');
    if (!container) return;

    // Если currentUser ещё не определён — ждём
    if (!currentUser) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">ЗАГРУЗКА...</p>';
        setTimeout(() => renderAdmin(), 100);
        return;
    }

    // Проверка доступа
    if (!isMaster(currentUser.uid)) {
        container.innerHTML = '<p style="color:#FF5555; text-align:center; padding:20px;">ДОСТУП ЗАКРЫТ. ТОЛЬКО ДЛЯ МАСТЕРА.</p>';
        return;
    }

    // ... дальше без изменений (subscribeToShop, subscribeToLootboxes и т.д.)
