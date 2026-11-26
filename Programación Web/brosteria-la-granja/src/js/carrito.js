// ==========================================
// MÓDULO DE CARRITO Y BOLETA DE VENTA
// ==========================================
let carrito = [];

export function agregarAlCarrito(nombre, precio) {
  const item = carrito.find(p => p.nombre === nombre);
  if (item) {
    item.cantidad += 1;
  } else {
    carrito.push({ nombre, precio: parseFloat(precio), cantidad: 1 });
  }
  actualizarVistaCarrito();
}

export function cambiarCantidad(nombre, delta) {
  const item = carrito.find(p => p.nombre === nombre);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(p => p.nombre !== nombre);
  }
  actualizarVistaCarrito();
}

export function vaciarCarrito() {
  carrito = [];
  actualizarVistaCarrito();
}

export function obtenerTotal() {
  return carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
}

function actualizarVistaCarrito() {
  const lista = document.querySelector('#lista-carrito');
  const contador = document.querySelector('#contador-carrito');
  const totalTxt = document.querySelector('#total-carrito');

  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  if (contador) contador.textContent = cantidadTotal;

  if (!lista) return;
  lista.innerHTML = "";

  if (carrito.length === 0) {
    lista.innerHTML = `<p style="text-align: center; color: #7A8B99; margin: 1.5rem 0;">El carrito está vacío 🍗</p>`;
    if (totalTxt) totalTxt.textContent = "S/ 0.00";
    return;
  }

  carrito.forEach(p => {
    const subtotal = p.precio * p.cantidad;
    const div = document.createElement("div");
    div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F0E6D2;";
    div.innerHTML = `
      <div style="flex: 1;">
        <strong style="color: #2F3E46; font-size: 0.9rem;">${p.nombre}</strong><br>
        <small style="color: #E76F51; font-weight: bold;">S/ ${p.precio.toFixed(2)} c/u</small>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button class="btn-cant" data-nombre="${p.nombre}" data-delta="-1" style="background: #FAEDCD; border: none; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
        <span style="font-weight: bold; min-width: 18px; text-align: center;">${p.cantidad}</span>
        <button class="btn-cant" data-nombre="${p.nombre}" data-delta="1" style="background: #FAEDCD; border: none; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
      </div>
      <div style="width: 70px; text-align: right; font-weight: bold; color: #2F3E46;">
        S/ ${subtotal.toFixed(2)}
      </div>
    `;
    lista.appendChild(div);
  });

  if (totalTxt) totalTxt.textContent = `S/ ${obtenerTotal().toFixed(2)}`;

  lista.querySelectorAll('.btn-cant').forEach(btn => {
    btn.onclick = () => {
      cambiarCantidad(btn.dataset.nombre, parseInt(btn.dataset.delta));
    };
  });
}

// Genera e imprime la boleta de venta oficial
export function generarBoleta(datosCliente) {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const total = obtenerTotal();
  const subtotalNeto = total / 1.18;
  const igv = total - subtotalNeto;
  const numeroBoleta = "B001-" + Math.floor(100000 + Math.random() * 900000);
  const fecha = new Date().toLocaleString('es-PE');

  const filas = carrito.map(p => `
    <tr>
      <td style="padding: 4px 0;">${p.cantidad}x ${p.nombre}</td>
      <td style="text-align: right; padding: 4px 0;">S/ ${(p.precio * p.cantidad).toFixed(2)}</td>
    </tr>
  `).join('');

  const modalBoleta = document.querySelector('#modal-boleta');
  const contenidoBoleta = document.querySelector('#boleta-imprimible');

  if (contenidoBoleta) {
    contenidoBoleta.innerHTML = `
      <div style="text-align: center; font-family: monospace; font-size: 0.85rem; line-height: 1.3;">
        <h3 style="margin: 0; font-size: 1.15rem; color: #2F3E46;">BROSTERÍA LA GRANJA</h3>
        <p style="margin: 2px 0;">RUC: 20489123841</p>
        <p style="margin: 2px 0;">Jr. Real 742 - Huancayo</p>
        <p style="margin: 2px 0;">Tel: (064) 234-567</p>
        <p style="margin: 8px 0; border-top: 1px dashed #444; border-bottom: 1px dashed #444; padding: 4px 0; font-weight: bold;">
          BOLETA DE VENTA ELECTRÓNICA<br>${numeroBoleta}
        </p>
        <div style="text-align: left; margin-bottom: 8px;">
          <div><strong>Fecha:</strong> ${fecha}</div>
          <div><strong>Cliente:</strong> ${datosCliente.nombre}</div>
          <div><strong>DNI/RUC:</strong> ${datosCliente.documento || 'Sin Documento'}</div>
          <div><strong>Pago:</strong> ${datosCliente.metodoPago}</div>
          <div><strong>Entrega:</strong> ${datosCliente.tipoEntrega} (${datosCliente.direccion || 'En Local'})</div>
        </div>
        <table style="width: 100%; border-top: 1px dashed #444; border-bottom: 1px dashed #444; margin-bottom: 8px;">
          <thead>
            <tr style="text-align: left;">
              <th style="padding: 4px 0;">Cant / Detalle</th>
              <th style="text-align: right; padding: 4px 0;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>
        <div style="text-align: right; margin-bottom: 6px;">
          <div>Op. Gravada: S/ ${subtotalNeto.toFixed(2)}</div>
          <div>I.G.V. (18%): S/ ${igv.toFixed(2)}</div>
          <div style="font-size: 1.05rem; font-weight: bold; margin-top: 4px;">TOTAL: S/ ${total.toFixed(2)}</div>
        </div>
        <p style="margin: 10px 0 0; border-top: 1px dashed #444; padding-top: 6px;">¡Gracias por su preferencia!<br>Brostería La Granja</p>
      </div>
    `;
  }

  if (modalBoleta) modalBoleta.style.display = "flex";
}