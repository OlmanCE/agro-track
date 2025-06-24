// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);