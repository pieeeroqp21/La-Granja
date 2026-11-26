import { db, auth } from './firebase.js';
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

// 1. Función para guardar la compra en Firestore al emitir la boleta
export async function registrarPedidoEnFirestore(carrito, total, nroBoleta, nombreCliente) {
  const usuario = auth.currentUser;
  if (!usuario) return;

  try {
    await addDoc(collection(db, "pedidos"), {
      userId: usuario.uid,
      clienteEmail: usuario.email,
      clienteNombre: nombreCliente || usuario.email,
      nroBoleta: nroBoleta,
      items: carrito,
      total: total,
      fecha: new Date().toISOString(),
      estado: "Completado"
    });
  } catch (error) {
    console.error("Error al registrar el pedido en el historial:", error);
  }
}

// 2. Cargar historial exclusivo del cliente autenticado
export function escucharHistorialCliente(contenedor) {
  const usuario = auth.currentUser;
  if (!usuario || !contenedor) return;

  // Consulta filtrada por el UID del usuario en sesión
  const q = query(
    collection(db, "pedidos"), 
    where("userId", "==", usuario.uid)
  );

  onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = "<p style='color: #777;'>Aún no tienes pedidos registrados en tu historial.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const fecha = new Date(p.fecha).toLocaleString('es-PE');

      const card = document.createElement("div");
      card.style.cssText = "background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);";
      
      const detalleItems = p.items.map(i => `${i.cantidad}x ${i.nombre} (S/ ${(i.precio * i.cantidad).toFixed(2)})`).join(', ');

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px; margin-bottom: 6px;">
          <strong style="color: #d90429;">📄 ${p.nroBoleta}</strong>
          <span style="font-size: 0.8rem; color: #888;">${fecha}</span>
        </div>
        <div style="font-size: 0.88rem; color: #444; margin-bottom: 6px;">
          <strong>Detalle:</strong> ${detalleItems}
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.95rem;">
          <span>Estado: <small style="color: #2b9348;">${p.estado}</small></span>
          <span style="color: #d90429;">Total: S/ ${Number(p.total).toFixed(2)}</span>
        </div>
      `;
      contenedor.appendChild(card);
    });
  }, (err) => console.error("Error cargando historial:", err));
}