// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7kUjC494xEvABxfvDZUUsJ_exGaXsBi4",
    authDomain: "agro-track-a3a79.firebaseapp.com",
    projectId: "agro-track-a3a79",
    storageBucket: "agro-track-a3a79.firebasestorage.app",
    messagingSenderId: "3999677205",
    appId: "1:3999677205:web:9c10cc9dbf605b2382471c",
    measurementId: "G-55WNG6V40L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export default app;