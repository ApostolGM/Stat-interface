const firebaseConfig = {
  apiKey: "AIzaSyDwLgiealkp1O3LxMH5yOIXvBaTANYFJM0",
  authDomain: "gephard-terminal.firebaseapp.com",
  databaseURL: "https://gephard-terminal-default-rtdb.firebaseio.com",
  projectId: "gephard-terminal",
  storageBucket: "gephard-terminal.firebasestorage.app",
  messagingSenderId: "737630152720",
  appId: "1:737630152720:web:64e5de2c921de2e5b84295"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
