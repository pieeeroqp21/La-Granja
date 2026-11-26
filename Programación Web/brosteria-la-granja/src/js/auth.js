import { auth, db } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// LÓGICA DE INICIO DE SESIÓN (login.html)
const formLogin = document.querySelector('#form-login');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value.trim();
    const password = document.querySelector('#login-password').value;
    const btn = document.querySelector('#btn-login');

    if (btn) btn.textContent = "Ingresando...";

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));

      if (userDoc.exists() && userDoc.data().rol === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error(error);
      if (btn) btn.textContent = "Ingresar";
      alert("Correo o contraseña incorrectos.");
    }
  });
}

// LÓGICA DE REGISTRO DE CUENTA (registro.html)
const formRegistro = document.querySelector('#form-registro');
if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.querySelector('#reg-nombre').value.trim();
    const email = document.querySelector('#reg-email').value.trim();
    const password = document.querySelector('#reg-password').value;
    const btn = document.querySelector('#btn-registro');

    if (btn) btn.textContent = "Registrando...";

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre: nombre,
        email: email,
        rol: "cliente",
        fecha: new Date().toISOString()
      });

      alert("¡Cuenta creada exitosamente!");
      window.location.href = "index.html";

    } catch (error) {
      console.error(error);
      if (btn) btn.textContent = "Registrarme";
      if (error.code === 'auth/email-already-in-use') {
        alert("Este correo ya está registrado.");
      } else if (error.code === 'auth/weak-password') {
        alert("La contraseña debe tener mínimo 6 caracteres.");
      } else {
        alert("Error al registrar: " + error.message);
      }
    }
  });
}