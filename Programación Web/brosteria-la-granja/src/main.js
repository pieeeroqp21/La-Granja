import { db, auth } from './js/firebase.js';
import { collection, onSnapshot, addDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { registrarPedidoEnFirestore, escucharHistorialCliente } from './js/pedidos.js';

// ==========================================
// 1. ESTADO DE SESIÓN Y NAVEGACIÓN
// ==========================================
const navLogin = document.querySelector('#nav-login');
const navUser = document.querySelector('#nav-user');
const navLogout = document.querySelector('#nav-logout');
const navAdmin = document.querySelector('#nav-admin');
const seccionHistorial = document.querySelector('#seccion-historial');
const contenedorHistorial = document.querySelector('#contenedor-historial');

let usuarioSesion = null;

onAuthStateChanged(auth, async (user) => {
  usuarioSesion = user;

  if (user) {
    if (navLogin) navLogin.style.display = 'none';
    if (navLogout) navLogout.style.display = 'inline-block';

    if (seccionHistorial) seccionHistorial.style.display = 'block';
    if (contenedorHistorial) escucharHistorialCliente(contenedorHistorial);

    try {
      const snap = await getDoc(doc(db, "usuarios", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (navUser) {
          navUser.textContent = `Hola, ${data.nombre || user.email}`;
          navUser.style.display = 'inline-block';
        }
        if (data.rol === 'admin' && navAdmin) {
          navAdmin.style.display = 'inline-block';
        }
      } else {
        if (navUser) {
          navUser.textContent = `Hola, ${user.email}`;
          navUser.style.display = 'inline-block';
        }
      }
    } catch (e) {
      console.warn("Error cargando perfil:", e);
    }
  } else {
    if (navLogin) navLogin.style.display = 'inline-block';
    if (navUser) navUser.style.display = 'none';
    if (navLogout) navLogout.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';

    if (seccionHistorial) seccionHistorial.style.display = 'none';
  }
});

if (navLogout) {
  navLogout.addEventListener('click', async () => {
    await signOut(auth);
    window.location.reload();
  });
}

// ==========================================
// 2. CARRITO DE COMPRAS Y DRAWER
// ==========================================
let carrito = [];

const guardado = localStorage.getItem("carrito_granja");
if (guardado) {
  try {
    carrito = JSON.parse(guardado);
  } catch (e) {
    carrito = [];
  }
}

const drawer = document.querySelector('#drawer-carrito');
const btnVerCarrito = document.querySelector('#btn-ver-carrito');
const btnCerrarCarrito = document.querySelector('#btn-cerrar-carrito');

if (btnVerCarrito && drawer) btnVerCarrito.onclick = () => drawer.classList.add('abierto');
if (btnCerrarCarrito && drawer) btnCerrarCarrito.onclick = () => drawer.classList.remove('abierto');

function actualizarVistaCarrito() {
  const cartItems = document.querySelector('#cart-items');
  const cartTotal = document.querySelector('#cart-total');
  const cartCount = document.querySelector('#cart-count');

  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPagar = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  if (cartCount) cartCount.textContent = totalUnidades;
  if (cartTotal) cartTotal.textContent = `S/ ${totalPagar.toFixed(2)}`;

  localStorage.setItem("carrito_granja", JSON.stringify(carrito));

  if (cartItems) {
    if (carrito.length === 0) {
      cartItems.innerHTML = '<p style="text-align:center; color:#888;">Tu carrito está vacío.</p>';
      return;
    }

    cartItems.innerHTML = '';
    carrito.forEach((item, index) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;';
      row.innerHTML = `
        <div>
          <strong style="font-size:0.95rem;">${item.nombre}</strong><br>
          <small style="color:#666;">S/ ${Number(item.precio).toFixed(2)} x ${item.cantidad}</small>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn-mod" data-action="restar" data-idx="${index}" style="padding:2px 8px; cursor:pointer;">-</button>
          <span>${item.cantidad}</span>
          <button class="btn-mod" data-action="sumar" data-idx="${index}" style="padding:2px 8px; cursor:pointer;">+</button>
        </div>
      `;
      cartItems.appendChild(row);
    });

    cartItems.querySelectorAll('.btn-mod').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        if (btn.dataset.action === 'sumar') {
          carrito[idx].cantidad++;
        } else {
          carrito[idx].cantidad--;
          if (carrito[idx].cantidad <= 0) carrito.splice(idx, 1);
        }
        actualizarVistaCarrito();
      };
    });
  }
}

actualizarVistaCarrito();

// ==========================================
// 3. CARGA DE PLATOS (MOSTRAR 10 INICIALES + BOTÓN "VER MÁS")
// ==========================================
let limiteProductos = 10;
let listaCompletaProductos = [];

const carta = document.querySelector('#carta-clientes');
const btnCargarMas = document.querySelector('#btn-cargar-mas');

function renderizarCarta() {
  if (!carta) return;
  carta.innerHTML = "";

  if (listaCompletaProductos.length === 0) {
    carta.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #777;'>No hay platos disponibles.</p>";
    if (btnCargarMas) btnCargarMas.style.display = 'none';
    return;
  }

  const productosVisibles = listaCompletaProductos.slice(0, limiteProductos);

  productosVisibles.forEach((plato) => {
    const card = document.createElement("div");
    card.className = "card-plato";
    card.innerHTML = `
      <div>
        <img src="${plato.imagen || ''}" onerror="this.src='https://placehold.co/300x180?text=La+Granja'" />
        <div class="card-body">
          <small style="color:var(--primary, #d90429); font-weight:bold; text-transform:uppercase;">${plato.categoria || 'Especialidad'}</small>
          <h3 style="margin:5px 0;">${plato.nombre}</h3>
          <p style="color:var(--text-muted, #666); font-size:0.85rem; margin:0;">${plato.descripcion || ''}</p>
        </div>
      </div>
      <div class="card-footer">
        <strong style="color:var(--primary, #d90429); font-size:1.15rem;">S/ ${Number(plato.precio).toFixed(2)}</strong>
        <button class="btn-pedir" data-nombre="${plato.nombre}" data-precio="${plato.precio}">+ Agregar</button>
      </div>
    `;
    carta.appendChild(card);
  });

  if (btnCargarMas) {
    if (listaCompletaProductos.length > limiteProductos) {
      btnCargarMas.style.display = 'inline-block';
    } else {
      btnCargarMas.style.display = 'none';
    }
  }

  carta.querySelectorAll('.btn-pedir').forEach(btn => {
    btn.onclick = () => {
      const nombre = btn.dataset.nombre;
      const precio = parseFloat(btn.dataset.precio);
      const existe = carrito.find(item => item.nombre === nombre);
      if (existe) {
        existe.cantidad++;
      } else {
        carrito.push({ nombre, precio, cantidad: 1 });
      }
      actualizarVistaCarrito();
      if (drawer) drawer.classList.add('abierto');
    };
  });
}

onSnapshot(collection(db, "productos"), (snapshot) => {
  listaCompletaProductos = [];
  snapshot.forEach((docSnap) => {
    listaCompletaProductos.push(docSnap.data());
  });
  renderizarCarta();
}, (err) => console.error("Error al cargar productos:", err));

if (btnCargarMas) {
  btnCargarMas.onclick = () => {
    limiteProductos += 10;
    renderizarCarta();
  };
}

// ==========================================
// 4. CARGA DE PROMOCIONES EN VIVO (DISEÑO VIVO)
// ==========================================
const seccionPromos = document.querySelector('#contenedor-promos');
onSnapshot(collection(db, "promociones"), (snapshot) => {
  if (!seccionPromos) return;
  seccionPromos.innerHTML = "";

  if (snapshot.empty) return;

  snapshot.forEach((docSnap) => {
    const promo = docSnap.data();
    const div = document.createElement("div");
    div.className = "card-promo-viva";
    div.innerHTML = `
      <div class="promo-badge">🔥</div>
      <div>
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${promo.titulo}
        </h3>
        <p style="margin: 4px 0 0; font-size: 0.95rem; opacity: 0.95; font-weight: 500;">
          ${promo.detalle}
        </p>
      </div>
    `;
    seccionPromos.appendChild(div);
  });
}, (err) => console.error("Error en promociones:", err));


// ==========================================
// 5. CHECKOUT, EMISIÓN DE BOLETA Y REGISTRO
// ==========================================
const btnFinalizar = document.querySelector('#btn-finalizar-pedido');

if (btnFinalizar) {
  btnFinalizar.onclick = async () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    if (!usuarioSesion) {
      alert("Debes iniciar sesión con tu cuenta para procesar tu pedido y emitir la boleta.");
      window.location.href = "login.html";
      return;
    }

    let nombreCliente = usuarioSesion.email;
    try {
      const snap = await getDoc(doc(db, "usuarios", usuarioSesion.uid));
      if (snap.exists() && snap.data().nombre) {
        nombreCliente = snap.data().nombre;
      }
    } catch (e) {
      console.warn("No se pudo obtener el nombre:", e);
    }

    const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const nroBoleta = "B001-" + Math.floor(100000 + Math.random() * 900000);
    const fecha = new Date().toLocaleString('es-PE');

    await registrarPedidoEnFirestore(carrito, total, nroBoleta, nombreCliente);

    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Boleta de Venta - La Granja</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 320px; margin: auto; }
          .center { text-align: center; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="center">
          <h3>🍗 BROSTERÍA LA GRANJA</h3>
          <p>RUC: 20485918231<br>Jr. Real 742 - Huancayo</p>
          <div class="line"></div>
          <strong>BOLETA DE VENTA ELECTRÓNICA</strong><br>
          <small>${nroBoleta}</small>
        </div>
        <div class="line"></div>
        <div class="row"><span>Cliente:</span><span>${nombreCliente}</span></div>
        <div class="row"><span>Correo:</span><span>${usuarioSesion.email}</span></div>
        <div class="row"><span>Fecha:</span><span>${fecha}</span></div>
        <div class="line"></div>
        ${carrito.map(i => `<div class="row"><span>${i.cantidad}x ${i.nombre}</span><span>S/ ${(i.precio * i.cantidad).toFixed(2)}</span></div>`).join('')}
        <div class="line"></div>
        <div class="row"><span>Op. Gravada:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
        <div class="row"><span>I.G.V. (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
        <div class="row" style="font-weight:bold; font-size:15px;"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        <div class="line"></div>
        <p class="center" style="font-size:12px;">¡Gracias por su compra!<br>El broaster más crujiente de Huancayo.</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    win.document.close();

    carrito = [];
    localStorage.removeItem("carrito_granja");
    actualizarVistaCarrito();
    if (drawer) drawer.classList.remove('abierto');
  };
}

// ==========================================
// 6. RESEÑAS EN TIEMPO REAL
// ==========================================
const formResena = document.querySelector('#form-resena');
const contenedorResenas = document.querySelector('#contenedor-resenas');

if (formResena) {
  formResena.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "resenas"), {
        nombre: document.querySelector('#resena-nombre').value.trim(),
        estrellas: parseInt(document.querySelector('#resena-estrellas').value),
        comentario: document.querySelector('#resena-comentario').value.trim(),
        fecha: new Date().toISOString()
      });
      formResena.reset();
      alert("¡Gracias por tu opinión!");
    } catch (err) {
      alert("Error al registrar reseña: " + err.message);
    }
  });
}

if (contenedorResenas) {
  onSnapshot(collection(db, "resenas"), (snapshot) => {
    contenedorResenas.innerHTML = "";
    if (snapshot.empty) {
      contenedorResenas.innerHTML = "<p style='color: #777;'>Sé el primero en opinar.</p>";
      return;
    }
    snapshot.forEach((docSnap) => {
      const res = docSnap.data();
      const item = document.createElement("div");
      item.style.cssText = "background:#fcfcfc; border:1px solid #eee; padding:10px; border-radius:8px; margin-bottom:8px;";
      item.innerHTML = `
        <strong>${res.nombre}</strong> <span style="color:#f59e0b;">${'★'.repeat(res.estrellas || 5)}</span>
        <p style="margin:4px 0 0; color:#555; font-size:0.85rem;">"${res.comentario}"</p>
      `;
      contenedorResenas.appendChild(item);
    });
  }, (err) => console.error("Error en reseñas:", err));
}