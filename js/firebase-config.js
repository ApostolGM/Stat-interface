// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-cMJQWYDEwcZ8Lnz9zdzXbxoQkO8f-yQ",
  authDomain: "gephard-terminal-e6f7c.firebaseapp.com",
  projectId: "gephard-terminal-e6f7c",
  storageBucket: "gephard-terminal-e6f7c.firebasestorage.app",
  messagingSenderId: "628698481230",
  appId: "1:628698481230:web:4fb609ae19f82ca51cf91f",
  measurementId: "G-XV44SY8EY9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
