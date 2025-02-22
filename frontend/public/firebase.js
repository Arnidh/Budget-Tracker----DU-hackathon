// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJaYqwufzIEkm4FzJ8vmf0cP9K_SR6j9c",
  authDomain: "budgeting-for-all.firebaseapp.com",
  projectId: "budgeting-for-all",
  storageBucket: "budgeting-for-all.firebasestorage.app",
  messagingSenderId: "283678084891",
  appId: "1:283678084891:web:cb5e3e78b555035b0b8dbe",
  measurementId: "G-9FE1Z9WPVY"
};

firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.db = db;
window.auth = auth;
export { db };