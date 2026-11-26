import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Reemplaza con tus datos reales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlSILk9oNtBBhTbY7B1PkbMW1EsVUptWU",
  authDomain: "la-granja-4f66a.firebaseapp.com",
  projectId: "la-granja-4f66a",
  storageBucket: "la-granja-4f66a.firebasestorage.app",
  messagingSenderId: "39242178645",
  appId: "1:39242178645:web:9827243c2138b83cb634dc",
 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Instancia que cifra las contraseñas