import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD7npo_-9KAwTJCxwRtzgceJt4_bostfss",
    authDomain: "donateit-80076.firebaseapp.com",
    projectId: "donateit-80076",
    storageBucket: "donateit-80076.firebasestorage.app",
    messagingSenderId: "916451582794",
    appId: "1:916451582794:web:efb23b8735dad5dd5217b3",
    measurementId: "G-D999GEXDBT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth,db,storage};