// Inicializar iconos Lucide
lucide.createIcons();

let rolActual = 'comprador';
let usuarioActual = { nombre: 'Invitado', rol: 'comprador' };

// 1. GESTIÓN DE LOGIN Y ROLES
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
    nombre: rol === 'comprador' ? 'Carlos (Comprador)' : 'Apiario El Roble',
    rol: rol
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
    badge.textContent = 'Modo Negocio / Productor';
    btnSwitch.querySelector('span').textContent = 'Ver como Comprador';
    document.getElementById('seller-business-name').textContent = usuarioActual.nombre;
  } else {
    vistaVendedor.classList.add('hidden');
    vistaComprador.classList.remove('hidden');
    badge.textContent = 'Modo Comprador';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Negocio';
  }
}

function alternarVistaRapida() {
  usuarioActual.rol = usuarioActual.rol === 'comprador' ? 'vendedor' : 'comprador';
  aplicarSesion();
}

function cerrarSesion() {
  document.getElementById('auth-overlay').classList.remove('hidden');
}

// 2. FILTROS DE CATEGORÍA EN MAPA
document.querySelectorAll('#category-filters .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    // Aquí tu compañero filtrará los pines de Leaflet según chip.dataset.cat
  });
});

// 3. PESTAÑAS DEL VENDEDOR
function cambiarTabVendedor(tabId, boton) {
  document.querySelectorAll('.seller-tab-content').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  boton.classList.add('active');
}

// 4. CONTROL DE INVENTARIO (+1 ENTRADA / -1 SALIDA)
function ajustarStock(elementId, cambio) {
  const el = document.getElementById(elementId);
  let valor = parseInt(el.textContent, 10) + cambio;
  if (valor < 0) valor = 0;
  el.textContent = valor;
  // En el siguiente paso conectaremos esto con Supabase para que se actualice en el mapa
}

// 5. MODALES Y WHATSAPP
function abrirDetalleTienda(nombreTienda) {
  document.getElementById('modal-tienda-nombre').textContent = nombreTienda;
  document.getElementById('modal-tienda').classList.remove('hidden');
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function pedirDirectoWhatsApp(producto, precio) {
  const texto = encodeURIComponent(`¡Hola! Vi tu producto "${producto}" ($${precio}) en RaízLocal y me gustaría hacer un pedido.`);
  window.open(`https://wa.me/526181234567?text=${texto}`, '_blank');
}

// 6. VERIFICACIÓN HUMANA ANTI-ESTAFA
function abrirModalVerificacion() {
  const retos = [
    '"Tómate una selfie frente a tu mercancía mostrando 3 dedos"',
    '"Sostén tu producto con la mano izquierda y sonríe a la cámara"',
    '"Muestra el pulgar arriba frente al mostrador de tu negocio"'
  ];
  document.getElementById('reto-texto').textContent = retos[Math.floor(Math.random() * retos.length)];
  document.getElementById('modal-verificacion').classList.remove('hidden');
}

function simularVerificacionIA(input) {
  if (!input.files || !input.files[0]) return;
  const status = document.getElementById('verify-status-text');
  status.textContent = 'Analizando prueba de vida y coordenadas GPS con Gemini Vision...';
  
  setTimeout(() => {
    const badge = document.getElementById('seller-verify-badge');
    badge.className = 'badge-verified';
    badge.innerHTML = '✓ Negocio Verificado en Sitio';
    cerrarModal('modal-verificacion');
  }, 1500);
}

// 7. BASE VISUAL DEL CHAT (Listo para conectar nuestra API de Gemini)
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
  
  // Respuesta provisional mientras conectamos api/chat.js
  setTimeout(() => {
    agregarBurbuja('chat-messages-comprador', 'Buscando productores verificados con stock disponible cerca de ti...', 'bot');
  }, 400);
}

function enviarMensajeVendedor(e) {
  e.preventDefault();
  const input = document.getElementById('input-chat-vendedor');
  const texto = input.value.trim();
  if (!texto) return;
  
  agregarBurbuja('chat-messages-vendedor', texto, 'user');
  input.value = '';
  
  setTimeout(() => {
    agregarBurbuja('chat-messages-vendedor', 'Procesando movimiento en tu inventario y actualizando el mapa...', 'bot');
  }, 400);
}

function agregarBurbuja(contenedorId, texto, tipo) {
  const box = document.getElementById(contenedorId);
  const div = document.createElement('div');
  div.className = `msg msg-${tipo}`;
  div.textContent = texto;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}