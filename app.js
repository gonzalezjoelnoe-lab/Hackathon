lucide.createIcons();

let rolActual = 'comprador';
let usuarioActual = { nombre: 'Invitado', rol: 'comprador' };

/* =========================================================
   APARTADO DE CONEXION A BASE DE DATOS (SUPABASE)
   Integrante encargado de BD: importar cliente Supabase aqui
   y reemplazar las funciones dentro de DB_HOOKS.
   ========================================================= */
const DB_HOOKS = {
  async obtenerNegociosYProductos() {
    // Conectar: supabase.from('negocios').select('*, productos(*)')
    return [];
  },
  async registrarMovimientoInventario(productoId, cambio) {
    // Conectar: actualizar stock_actual en 'productos' e insertar en 'movimientos_inventario'
    console.log('Pendiente sincronizar movimiento en BD:', { productoId, cambio });
  },
  async crearProducto(datosProducto) {
    // Conectar: supabase.from('productos').insert(datosProducto)
    console.log('Pendiente insertar producto en BD:', datosProducto);
  },
  async actualizarEstadoVerificacion(negocioId, fotoUrl) {
    // Conectar: supabase.from('negocios').update({ verificado: true, foto_verificacion_url: fotoUrl })
    console.log('Pendiente actualizar verificacion en BD:', { negocioId, fotoUrl });
  }
};

/* =========================================================
   APARTADO DE CONEXION AL MAPA (LEAFLET)
   Integrante encargado de Mapa: inicializar L.map('map') aqui
   y pintar marcadores con los datos de DB_HOOKS.
   ========================================================= */
const MAP_HOOKS = {
  mapInstance: null,
  inicializar() {
    // Ejemplo:
    // this.mapInstance = L.map('map').setView([24.0277, -104.6532], 13);
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.mapInstance);
    // document.getElementById('map-empty-state')?.classList.add('hidden');
  },
  filtrarPorCategoria(categoria) {
    console.log('Filtrar marcadores en mapa por:', categoria);
  }
};

/* =========================================================
   CONTROL DE SESION Y NAVEGACION
   ========================================================= */
function seleccionarRolAuth(rol) {
  rolActual = rol;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === rol);
  });
}

function iniciarSesion(event) {
  event.preventDefault();
  const nombre = document.getElementById('auth-nombre').value.trim();
  usuarioActual = { nombre, rol: rolActual };
  aplicarSesion();
}

function accesoRapido(rol) {
  rolActual = rol;
  usuarioActual = {
    nombre: rol === 'comprador' ? 'Comprador Local' : 'Establecimiento Local',
    rol
  };
  aplicarSesion();
}

function aplicarSesion() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('user-display-name').textContent = usuarioActual.nombre;
  document.getElementById('user-avatar').textContent = usuarioActual.nombre.charAt(0).toUpperCase();

  const vistaComprador = document.getElementById('vista-comprador');
  const vistaVendedor = document.getElementById('vista-vendedor');
  const badge = document.getElementById('nav-role-badge');
  const btnSwitch = document.getElementById('btn-switch-role');

  if (usuarioActual.rol === 'vendedor') {
    vistaComprador.classList.add('hidden');
    vistaVendedor.classList.remove('hidden');
    badge.textContent = 'Negocio / Productor';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Comprador';
    document.getElementById('seller-business-name').textContent = usuarioActual.nombre;
  } else {
    vistaVendedor.classList.add('hidden');
    vistaComprador.classList.remove('hidden');
    badge.textContent = 'Comprador';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Negocio';
    MAP_HOOKS.inicializar();
  }
}

function alternarVistaRapida() {
  usuarioActual.rol = usuarioActual.rol === 'comprador' ? 'vendedor' : 'comprador';
  aplicarSesion();
}

function cerrarSesion() {
  document.getElementById('auth-overlay').classList.remove('hidden');
}

/* =========================================================
   INTERACCION DE FILTROS, INVENTARIO Y MODALES
   ========================================================= */
document.querySelectorAll('#category-filters .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    MAP_HOOKS.filtrarPorCategoria(chip.dataset.cat);
  });
});

function cambiarTabVendedor(tabId, boton) {
  document.querySelectorAll('.seller-tab-content').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  boton.classList.add('active');
}

function ajustarStock(productoId, cambio) {
  const el = document.getElementById(`stock-${productoId}`);
  if (!el) return;
  const nuevoValor = Math.max(0, parseInt(el.textContent, 10) + cambio);
  el.textContent = nuevoValor;
  DB_HOOKS.registrarMovimientoInventario(productoId, cambio);
}

function abrirDetalleTienda(datosNegocio) {
  if (datosNegocio?.nombre) {
    document.getElementById('modal-tienda-nombre').textContent = datosNegocio.nombre;
  }
  document.getElementById('modal-tienda').classList.remove('hidden');
}

function abrirModalNuevoProducto() {
  document.getElementById('modal-nuevo-producto').classList.remove('hidden');
}

function guardarProductoManual(event) {
  event.preventDefault();
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock = parseInt(document.getElementById('prod-stock').value, 10);

  DB_HOOKS.crearProducto({ nombre, precio, stock });
  cerrarModal('modal-nuevo-producto');
  event.target.reset();
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

/* =========================================================
   VERIFICACION HUMANA
   ========================================================= */
function abrirModalVerificacion() {
  const retos = [
    'Captura una fotografía frente a tu mercancía o mostrador mostrando tres dedos',
    'Sostén uno de tus artículos con la mano izquierda frente a la cámara',
    'Muestra la palma abierta junto al espacio físico de tu negocio'
  ];
  document.getElementById('reto-texto').textContent = retos[Math.floor(Math.random() * retos.length)];
  document.getElementById('modal-verificacion').classList.remove('hidden');
}

function procesarVerificacion(input) {
  if (!input.files || !input.files[0]) return;
  const status = document.getElementById('verify-status-text');
  status.textContent = 'Validando captura y ubicación...';

  setTimeout(() => {
    const badge = document.getElementById('seller-verify-badge');
    badge.className = 'badge-verified';
    badge.innerHTML = '<i data-lucide="shield-check"></i> Negocio Verificado';
    lucide.createIcons();
    DB_HOOKS.actualizarEstadoVerificacion(null, null);
    cerrarModal('modal-verificacion');
  }, 1200);
}

/* =========================================================
   ASISTENTE CONVERSACIONAL (BASE LISTA PARA API GEMINI)
   ========================================================= */
function usarPromptRapido(texto) {
  document.getElementById('input-chat-comprador').value = texto;
}

function enviarMensajeComprador(e) {
  e.preventDefault();
  const input = document.getElementById('input-chat-comprador');
  const texto = input.value.trim();
  if (!texto) return;

  agregarBurbuja('chat-messages-comprador', texto, 'user');
  input.value = '';
}

function enviarMensajeVendedor(e) {
  e.preventDefault();
  const input = document.getElementById('input-chat-vendedor');
  const texto = input.value.trim();
  if (!texto) return;

  agregarBurbuja('chat-messages-vendedor', texto, 'user');
  input.value = '';
}

function agregarBurbuja(contenedorId, texto, tipo) {
  const box = document.getElementById(contenedorId);
  const div = document.createElement('div');
  div.className = `msg msg-${tipo}`;
  div.textContent = texto;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
