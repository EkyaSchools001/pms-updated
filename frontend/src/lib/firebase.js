import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Vite, we use import.meta.env to access environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDR6xrhvpU9O_PbdbOmFVRUO50wnme0oIw",
    authDomain: "ekya-pms.firebaseapp.com",
    projectId: "ekya-pms",
    storageBucket: "ekya-pms.firebasestorage.app",
    messagingSenderId: "572384512871",
    appId: "1:572384512871:web:9d8c16228d991f77083dc2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
