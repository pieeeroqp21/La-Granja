import { db, auth } from './firebase.js';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// CONTROL DE ACCESO OBLIGATORIO PARA ADMIN
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión con tu cuenta de Administrador.");
    window.location.href = "/login.html";
    return;
  }

  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists() || snap.data().rol !== "admin") {
    alert("Acceso denegado: Esta vista es exclusiva para el Administrador.");
    window.location.href = "/index.html";
  }
});

// ==========================================
// 1. GESTIÓN DE PLATOS (productos)
// ==========================================
const formProducto = document.querySelector('#form-producto');
const listaAdmin = document.querySelector('#lista-admin');

if (formProducto) {
  formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "productos"), {
        nombre: document.querySelector('#nombre').value.trim(),
        categoria: document.querySelector('#categoria').value,
        precio: parseFloat(document.querySelector('#precio').value),
        imagen: document.querySelector('#imagen').value.trim(),
        descripcion: document.querySelector('#descripcion').value.trim(),
        fecha: new Date().toISOString()
      });
      formProducto.reset();
      alert("¡Plato guardado con éxito!");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  });
}

if (listaAdmin) {
  onSnapshot(collection(db, "productos"), (snapshot) => {
    listaAdmin.innerHTML = "";
    if (snapshot.empty) {
      listaAdmin.innerHTML = "<p>No hay platos registrados aún.</p>";
      return;
    }
    snapshot.forEach((documento) => {
      const item = documento.data();
      const div = document.createElement("div");
      div.style.cssText = "display: flex; gap: 10px; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;";
      div.innerHTML = `
        <img src="${item.imagen || ''}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://placehold.co/60x60?text=Plato'" />
        <div style="flex: 1;">
          <strong>${item.nombre}</strong> <small>(${item.categoria})</small><br>
          <span style="color: #d90429; font-weight: bold;">S/ ${Number(item.precio).toFixed(2)}</span>
        </div>
        <button class="btn-borrar-plato" data-id="${documento.id}" style="background: #ef233c; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
          Eliminar
        </button>
      `;
      listaAdmin.appendChild(div);
    });

    listaAdmin.querySelectorAll('.btn-borrar-plato').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar este plato?")) {
          await deleteDoc(doc(db, "productos", btn.dataset.id));
        }
      };
    });
  });
}

// ==========================================
// 2. GESTIÓN DE PROMOCIONES (promociones)
// ==========================================
const formPromo = document.querySelector('#form-promo');
const listaPromos = document.querySelector('#lista-promos');

if (formPromo) {
  formPromo.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "promociones"), {
        titulo: document.querySelector('#promo-titulo').value.trim(),
        detalle: document.querySelector('#promo-detalle').value.trim(),
        fecha: new Date().toISOString()
      });
      formPromo.reset();
      alert("¡Promoción publicada!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

if (listaPromos) {
  onSnapshot(collection(db, "promociones"), (snapshot) => {
    listaPromos.innerHTML = "";
    if (snapshot.empty) {
      listaPromos.innerHTML = "<p style='color: #777;'>No hay promociones activas.</p>";
      return;
    }
    snapshot.forEach((documento) => {
      const promo = documento.data();
      const div = document.createElement("div");
      div.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 8px 0;";
      div.innerHTML = `
        <div style="flex: 1;">
          <strong style="color: #e65100;">${promo.titulo}</strong>
          <p style="margin: 2px 0 0; color: #555; font-size: 0.82rem;">${promo.detalle}</p>
        </div>
        <button class="btn-borrar-promo" data-id="${documento.id}" style="background: #ef233c; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer;">
          Eliminar
        </button>
      `;
      listaPromos.appendChild(div);
    });

    listaPromos.querySelectorAll('.btn-borrar-promo').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar esta promoción?")) {
          await deleteDoc(doc(db, "promociones", btn.dataset.id));
        }
      };
    });
  });
}

// ==========================================
// 3. GESTIÓN DE RESEÑAS (resenas)
// ==========================================
const listaResenas = document.querySelector('#lista-resenas');

if (listaResenas) {
  onSnapshot(collection(db, "resenas"), (snapshot) => {
    listaResenas.innerHTML = "";
    if (snapshot.empty) {
      listaResenas.innerHTML = "<p style='color: #777;'>No hay opiniones registradas.</p>";
      return;
    }
    snapshot.forEach((documento) => {
      const r = documento.data();
      const div = document.createElement("div");
      div.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 8px 0;";
      div.innerHTML = `
        <div>
          <strong>${r.nombre}</strong> - <span>${'⭐'.repeat(r.estrellas || 5)}</span>
          <p style="margin: 2px 0 0; color: #555; font-size: 0.85rem;">${r.comentario}</p>
        </div>
        <button class="btn-borrar-resena" data-id="${documento.id}" style="background: #ef233c; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer;">
          Eliminar
        </button>
      `;
      listaResenas.appendChild(div);
    });

    listaResenas.querySelectorAll('.btn-borrar-resena').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar esta opinión?")) {
          await deleteDoc(doc(db, "resenas", btn.dataset.id));
        }
      };
    });
  });
}

// ==========================================
// BANDEJA GENERAL DE PEDIDOS (admin.html)
// ==========================================
const listaPedidosAdmin = document.querySelector('#lista-pedidos-admin');

if (listaPedidosAdmin) {
  onSnapshot(collection(db, "pedidos"), (snapshot) => {
    listaPedidosAdmin.innerHTML = "";

    if (snapshot.empty) {
      listaPedidosAdmin.innerHTML = "<p style='color: #777;'>No hay ventas ni pedidos registrados aún.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const fecha = p.fecha ? new Date(p.fecha).toLocaleString('es-PE') : '';
      const detalleItems = p.items ? p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ') : '';

      const div = document.createElement("div");
      div.style.cssText = "border-bottom: 1px solid #eee; padding: 10px 0; font-size: 0.9rem;";
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-weight:bold;">
          <span style="color:#d90429;">📄 ${p.nroBoleta || 'S/N'}</span>
          <span style="color:#2b9348;">${p.estado || 'Completado'}</span>
        </div>
        <div><strong>Cliente:</strong> ${p.clienteNombre || 'Anónimo'} (${p.clienteEmail || ''})</div>
        <div><small style="color:#555;"><strong>Detalle:</strong> ${detalleItems}</small></div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;">
          <small style="color:#888;">${fecha}</small>
          <strong>Total: S/ ${Number(p.total || 0).toFixed(2)}</strong>
        </div>
      `;
      listaPedidosAdmin.appendChild(div);
    });
  }, (err) => console.error("Error al cargar pedidos en admin:", err));
}