lucide.createIcons();

let rolRegistro = 'comprador';
let usuarioActual = null;
let entradasTurno = 0;
let salidasTurno = 0;

const CATEGORIAS_CATALOGO = {
  'Producción Local': [
    'Miel y Derivados',
    'Lácteos y Quesos',
    'Frutas y Hortalizas',
    'Panadería Artesanal',
    'Conservas y Salsas'
  ],
  'Tiendas y Abarrotes': [
    'Despensa Básica',
    'Bebidas',
    'Lácteos y Embutidos',
    'Limpieza del Hogar',
    'Botanas y Dulcería'
  ],
  'Insumos y Papelería': [
    'Papelería Escolar',
    'Mercería y Costura',
    'Empaques y Desechables',
    'Material de Oficina'
  ],
  'Talleres y Oficios': [
    'Artesanías',
    'Carpintería y Madera',
    'Textiles y Bordado',
    'Herrería y Reparaciones'
  ]
};

let inventarioLocal = [
  {
    id: 'demo-1',
    nombre: 'Artículo de Muestra',
    categoria: 'Producción Local',
    subcategoria: 'Miel y Derivados',
    precio: 120.00,
    stock: 10,
    minimo: 5
  }
];

/* =========================================================
   APARTADO DE CONEXION A BASE DE DATOS (SUPABASE)
   ========================================================= */
const DB_HOOKS = {
  async registrarUsuario(datosUsuario) {
    const usuariosGuardados = JSON.parse(localStorage.getItem('nexolocal_usuarios') || '[]');
    if (usuariosGuardados.some(u => u.contacto.toLowerCase() === datosUsuario.contacto.toLowerCase())) {
      return { error: 'Este correo o teléfono ya está registrado.' };
    }
    const nuevo = { id: crypto.randomUUID(), verificado: false, ...datosUsuario };
    usuariosGuardados.push(nuevo);
    localStorage.setItem('nexolocal_usuarios', JSON.stringify(usuariosGuardados));
    return { data: nuevo };
  },

  async autenticarUsuario(contacto, password) {
    const usuariosGuardados = JSON.parse(localStorage.getItem('nexolocal_usuarios') || '[]');
    const encontrado = usuariosGuardados.find(
      u => u.contacto.toLowerCase() === contacto.toLowerCase() && u.password === password
    );
    if (!encontrado) {
      return { error: 'Credenciales incorrectas o cuenta no encontrada.' };
    }
    return { data: encontrado };
  },

  async registrarMovimientoInventario(productoId, tipo, cantidad) {
    console.log('Sincronizar en Supabase:', { productoId, tipo, cantidad });
  },

  async crearProducto(datosProducto) {
    console.log('Insertar producto en Supabase:', datosProducto);
  },

  async guardarVerificacionHumana(usuarioId, coordenadas) {
    console.log('Guardar verificación en Supabase:', { usuarioId, coordenadas });
  }
};

/* =========================================================
   APARTADO DE CONEXION AL MAPA (LEAFLET)
   ========================================================= */
const MAP_HOOKS = {
 // 2. Inicializar mapa centrado en Durango
const map = L.map('map').setView([24.0298, -104.6506], 15);

// Quita el cuadro "Contenedor de Mapa Listo" y recalcula el tamaño del mapa
document.getElementById('map-empty-state')?.remove();
setTimeout(() => map.invalidateSize(), 300);

// 3. Mapa base: solo calles, sin negocios
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri',
  maxNativeZoom: 16,
  maxZoom: 19
}).addTo(map);

// Nombres de calles y colonias (borra este bloque si no los quieres)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
  maxNativeZoom: 16,
  maxZoom: 19
}).addTo(map);

// 4. Ícono personalizado del productor
const iconoProductor = L.divIcon({
  className: 'pin-custom',
  html: '<div class="pin"><span>🌿</span></div>',
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -44]
});

// 5. Evita que texto de la base de datos rompa el HTML del popup
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// 6. Consultar productores y sus productos
async function cargarMapa() {
  const { data: productores, error } = await supabaseClient
    .from('productores')
    .select(`
      id,
      nombre_negocio,
      whatsapp,
      historia,
      latitud,
      longitud,
      productos (
        id,
        nombre,
        categoria,
        descripcion,
        precio,
        imagen_url
      )
    `);

  if (error) {
    console.error('Error al consultar Supabase:', error.message);
    return;
  }

  const marcadores = [];

  // 7. Pintar cada productor en el mapa
  productores.forEach(prod => {
    if (prod.latitud == null || prod.longitud == null) return;

    const listaProductosHTML = (prod.productos && prod.productos.length > 0)
      ? prod.productos.map(item => `
          <div class="producto-item">
            ${item.imagen_url ? `<img src="${esc(item.imagen_url)}" alt="${esc(item.nombre)}" class="producto-img">` : ''}
            ${item.categoria ? `<span class="badge-cat">${esc(item.categoria)}</span><br>` : ''}
            <div class="producto-titulo">${esc(item.nombre)} — <span class="producto-precio">$${esc(item.precio)}</span></div>
            ${item.descripcion ? `<p class="producto-desc">${esc(item.descripcion)}</p>` : ''}
          </div>
        `).join('')
      : '<p class="producto-desc"><em>Este productor aún no tiene productos cargados.</em></p>';

    const mensajeWA = encodeURIComponent(`Hola ${prod.nombre_negocio}, vi sus productos en el mapa y me gustaría hacer un pedido.`);
    const telefono = String(prod.whatsapp ?? '').replace(/\D/g, '');

    const popupHTML = `
      <div class="popup-card">
        <h3>${esc(prod.nombre_negocio)}</h3>
        ${prod.historia ? `<p class="popup-historia">${esc(prod.historia)}</p>` : ''}
        ${listaProductosHTML}
        <a href="https://wa.me/${telefono}?text=${mensajeWA}" target="_blank" rel="noopener" class="btn-wa">
          Pedir por WhatsApp
        </a>
      </div>
    `;

    const marker = L.marker([prod.latitud, prod.longitud], { icon: iconoProductor })
      .addTo(map)
      .bindPopup(popupHTML, { maxWidth: 280 });
    marcadores.push(marker);
  });

  // 8. Ajustar el mapa para que se vean todos los pines
  if (marcadores.length > 0) {
    map.fitBounds(L.featureGroup(marcadores).getBounds().pad(0.2), { maxZoom: 16 });
  }
}

cargarMapa();
};

/* =========================================================
   VALIDACION ESTRICTA DE NUMEROS Y CONTRASENAS
   ========================================================= */
function soloNumeros(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
}

function soloDecimales(input) {
  input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function normalizarCantidadInput(input) {
  const limpio = input.value.replace(/[^0-9]/g, '');
  const numero = parseInt(limpio, 10);
  input.value = (!numero || numero <= 0) ? '1' : String(numero);
}

function verificarReglasPassword(pass) {
  const longitudValida = pass.length >= 8 && pass.length <= 10 && !/\s/.test(pass);
  const tieneNumero = /[0-9]/.test(pass);
  const tieneEspecial = /[^A-Za-z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/.test(pass);
  return {
    longitudValida,
    tieneNumero,
    tieneEspecial,
    esValida: longitudValida && tieneNumero && tieneEspecial
  };
}

function validarPasswordEnVivo(valor) {
  const estado = verificarReglasPassword(valor);
  actualizarEstadoRegla('rule-len', estado.longitudValida);
  actualizarEstadoRegla('rule-num', estado.tieneNumero);
  actualizarEstadoRegla('rule-sym', estado.tieneEspecial);
  lucide.createIcons();
}

function actualizarEstadoRegla(id, cumple) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('valid', cumple);
  const icono = el.querySelector('svg, i');
  if (icono) {
    icono.setAttribute('data-lucide', cumple ? 'check-circle-2' : 'circle');
  }
}

/* =========================================================
   REGISTRO E INICIO DE SESION
   ========================================================= */
function cambiarModoAuth(modo) {
  const esLogin = modo === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !esLogin);
  document.getElementById('register-form').classList.toggle('hidden', esLogin);
  document.getElementById('tab-btn-login').classList.toggle('active', esLogin);
  document.getElementById('tab-btn-registro').classList.toggle('active', !esLogin);
  document.getElementById('auth-error-msg').classList.add('hidden');
  document.getElementById('reg-error-msg').classList.add('hidden');
}

function seleccionarRolRegistro(rol) {
  rolRegistro = rol;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === rol);
  });
  const esVendedor = rol === 'vendedor';
  document.getElementById('campos-extra-vendedor').classList.toggle('hidden', !esVendedor);
  document.getElementById('label-reg-nombre').textContent = esVendedor
    ? 'Nombre comercial del negocio o productor'
    : 'Nombre completo';
  document.getElementById('reg-nombre').placeholder = esVendedor
    ? 'Ej. Abarrotes El Centro'
    : 'Ej. Ana Martínez';
}

async function procesarRegistro(event) {
  event.preventDefault();
  const errorBox = document.getElementById('reg-error-msg');
  errorBox.classList.add('hidden');

  const password = document.getElementById('reg-password').value;
  const checkPass = verificarReglasPassword(password);

  if (!checkPass.esValida) {
    errorBox.textContent = 'La contraseña debe tener entre 8 y 10 caracteres (sin espacios), incluir al menos un número y un carácter especial.';
    errorBox.classList.remove('hidden');
    return;
  }

  const datos = {
    nombre: document.getElementById('reg-nombre').value.trim(),
    contacto: document.getElementById('reg-contacto').value.trim(),
    password,
    rol: rolRegistro,
    giro: rolRegistro === 'vendedor' ? document.getElementById('reg-giro').value : null,
    whatsapp: rolRegistro === 'vendedor' ? document.getElementById('reg-whatsapp').value.trim() : null
  };

  const { data, error } = await DB_HOOKS.registrarUsuario(datos);
  if (error) {
    errorBox.textContent = error;
    errorBox.classList.remove('hidden');
    return;
  }

  usuarioActual = data;
  localStorage.setItem('nexolocal_sesion', JSON.stringify(usuarioActual));
  aplicarSesion();
}

async function procesarLogin(event) {
  event.preventDefault();
  const errorBox = document.getElementById('auth-error-msg');
  errorBox.classList.add('hidden');

  const contacto = document.getElementById('login-contacto').value.trim();
  const password = document.getElementById('login-password').value;

  const { data, error } = await DB_HOOKS.autenticarUsuario(contacto, password);
  if (error) {
    errorBox.textContent = error;
    errorBox.classList.remove('hidden');
    return;
  }

  usuarioActual = data;
  localStorage.setItem('nexolocal_sesion', JSON.stringify(usuarioActual));
  aplicarSesion();
}

function accesoRapido(rol) {
  usuarioActual = {
    id: 'demo-user',
    nombre: rol === 'comprador' ? 'Comprador Invitado' : 'Establecimiento Local',
    rol,
    verificado: false
  };
  aplicarSesion();
}

function aplicarSesion() {
  if (!usuarioActual) return;
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
    actualizarBadgeVerificacion(Boolean(usuarioActual.verificado));
    renderizarInventario();
  } else {
    vistaVendedor.classList.add('hidden');
    vistaComprador.classList.remove('hidden');
    badge.textContent = 'Comprador';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Negocio';
    MAP_HOOKS.inicializar();
  }
}

function alternarVistaRapida() {
  if (!usuarioActual) return;
  usuarioActual.rol = usuarioActual.rol === 'comprador' ? 'vendedor' : 'comprador';
  aplicarSesion();
}

function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem('nexolocal_sesion');
  document.getElementById('auth-overlay').classList.remove('hidden');
}

/* =========================================================
   CATEGORIAS, SUBCATEGORIAS E INVENTARIO
   ========================================================= */
function actualizarSubcategoriasModal(categoriaSeleccionada) {
  const selectSub = document.getElementById('prod-subcategoria');
  if (!selectSub) return;
  const opciones = CATEGORIAS_CATALOGO[categoriaSeleccionada] || ['General'];
  selectSub.innerHTML = opciones
    .map(sub => `<option value="${sub}">${sub}</option>`)
    .join('');
}

function renderizarSubcategoriasComprador(categoria) {
  const bar = document.getElementById('subcategory-bar');
  const contenedor = document.getElementById('subcategory-filters');
  if (!bar || !contenedor) return;

  if (categoria === 'todos' || !CATEGORIAS_CATALOGO[categoria]) {
    bar.classList.add('hidden');
    contenedor.innerHTML = '';
    return;
  }

  const subs = CATEGORIAS_CATALOGO[categoria];
  contenedor.innerHTML = `<button class="subchip active" data-sub="todas">Todas</button>` +
    subs.map(s => `<button class="subchip" data-sub="${s}">${s}</button>`).join('');

  contenedor.querySelectorAll('.subchip').forEach(btn => {
    btn.addEventListener('click', () => {
      contenedor.querySelectorAll('.subchip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      MAP_HOOKS.filtrarPorCategoria(categoria, btn.dataset.sub);
    });
  });

  bar.classList.remove('hidden');
}

function renderizarInventario() {
  const tbody = document.getElementById('tabla-inventario-body');
  tbody.innerHTML = '';

  let criticos = 0;

  inventarioLocal.forEach(item => {
    const esCritico = item.stock <= item.minimo;
    if (esCritico) criticos++;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>
        <div class="cat-cell">
          <span class="cat-main">${item.categoria}</span>
          <span class="subcat-tag">${item.subcategoria || 'General'}</span>
        </div>
      </td>
      <td>$${Number(item.precio).toFixed(2)}</td>
      <td><strong id="stock-${item.id}">${item.stock}</strong> uds</td>
      <td>
        <span class="${esCritico ? 'badge-danger' : 'badge-ok'}">
          ${esCritico ? 'Stock crítico' : 'En existencia'}
        </span>
      </td>
      <td>
        <div class="kardex-controls">
          <button type="button" class="btn-kardex minus" onclick="aplicarMovimientoStock('${item.id}', 'SALIDA')" title="Registrar salida">
            <i data-lucide="minus"></i> Salida
          </button>
          <input
            type="text"
            inputmode="numeric"
            id="qty-${item.id}"
            class="qty-input"
            value="1"
            aria-label="Cantidad a mover"
            oninput="soloNumeros(this)"
            onblur="normalizarCantidadInput(this)"
          />
          <button type="button" class="btn-kardex plus" onclick="aplicarMovimientoStock('${item.id}', 'ENTRADA')" title="Registrar entrada">
            <i data-lucide="plus"></i> Entrada
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('kpi-total-productos').textContent = inventarioLocal.length;
  document.getElementById('kpi-stock-bajo').textContent = criticos;
  document.getElementById('kpi-entradas').textContent = `${entradasTurno} uds`;
  document.getElementById('kpi-salidas').textContent = `${salidasTurno} uds`;
  lucide.createIcons();
}

function aplicarMovimientoStock(productoId, tipo) {
  const inputQty = document.getElementById(`qty-${productoId}`);
  normalizarCantidadInput(inputQty);
  const cantidad = parseInt(inputQty.value, 10);

  const producto = inventarioLocal.find(p => p.id === productoId);
  if (!producto) return;

  if (tipo === 'ENTRADA') {
    producto.stock += cantidad;
    entradasTurno += cantidad;
  } else {
    const descontado = Math.min(producto.stock, cantidad);
    producto.stock = Math.max(0, producto.stock - cantidad);
    salidasTurno += descontado;
  }

  renderizarInventario();
  DB_HOOKS.registrarMovimientoInventario(productoId, tipo, cantidad);
}

function guardarProductoManual(event) {
  event.preventDefault();
  const nombre = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value;
  const subcategoria = document.getElementById('prod-subcategoria').value;
  const precio = parseFloat(document.getElementById('prod-precio').value) || 0;
  const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;

  const nuevo = {
    id: `prod-${Date.now()}`,
    nombre,
    categoria,
    subcategoria,
    precio,
    stock,
    minimo: 5
  };

  inventarioLocal.push(nuevo);
  renderizarInventario();
  DB_HOOKS.crearProducto(nuevo);
  cerrarModal('modal-nuevo-producto');
  event.target.reset();
  actualizarSubcategoriasModal(document.getElementById('prod-categoria').value);
}

/* =========================================================
   COMPRESION DE IMAGEN Y VERIFICACION HUMANA REAL CON IA
   ========================================================= */
function comprimirImagenBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function abrirModalVerificacion() {
  const retos = [
    'Muestra exactamente tres dedos de tu mano frente a la cámara dentro de tu local',
    'Levanta el pulgar hacia arriba frente a tu mercancía o espacio de trabajo',
    'Muestra la palma abierta de tu mano frente a la cámara en tu establecimiento'
  ];
  document.getElementById('reto-texto').textContent = retos[Math.floor(Math.random() * retos.length)];
  const feedback = document.getElementById('verify-feedback');
  feedback.classList.add('hidden');
  feedback.classList.remove('ok');
  document.getElementById('modal-verificacion').classList.remove('hidden');
}

async function procesarVerificacionReal(input) {
  if (!input.files || !input.files[0]) return;
  const feedback = document.getElementById('verify-feedback');
  const retoActual = document.getElementById('reto-texto').textContent;

  feedback.textContent = 'Analizando fotografía en vivo con IA y verificando ubicación...';
  feedback.classList.remove('hidden', 'ok');

  try {
    const imagenBase64 = await comprimirImagenBase64(input.files[0]);

    let coords = null;
    if (navigator.geolocation) {
      coords = await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 4000 }
        );
      });
    }

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'VERIFICAR_HUMANO',
        imagenBase64,
        mimeType: 'image/jpeg',
        retoVerificacion: retoActual
      })
    });

    const resultado = await resp.json();

    if (resultado.aprobado) {
      feedback.textContent = `Validación exitosa: ${resultado.razon}`;
      feedback.classList.add('ok');
      if (usuarioActual) {
        usuarioActual.verificado = true;
        localStorage.setItem('nexolocal_sesion', JSON.stringify(usuarioActual));
        await DB_HOOKS.guardarVerificacionHumana(usuarioActual.id, coords);
      }
      actualizarBadgeVerificacion(true);
      setTimeout(() => cerrarModal('modal-verificacion'), 1500);
    } else {
      feedback.textContent = `No aprobado: ${resultado.razon || 'La imagen no cumple la seña solicitada.'} Intenta nuevamente.`;
    }
  } catch (err) {
    feedback.textContent = 'No se pudo conectar con el servicio de validación. Verifica GEMINI_API_KEY en Vercel.';
  } finally {
    input.value = '';
  }
}

function actualizarBadgeVerificacion(verificado) {
  const badge = document.getElementById('seller-verify-badge');
  const btn = document.getElementById('btn-abrir-verificacion');
  if (verificado) {
    badge.className = 'badge-verified';
    badge.innerHTML = '<i data-lucide="shield-check"></i> Negocio Verificado';
    if (btn) btn.classList.add('hidden');
  } else {
    badge.className = 'status-unverified';
    badge.innerHTML = '<i data-lucide="shield-alert"></i> Verificación pendiente';
    if (btn) btn.classList.remove('hidden');
  }
  lucide.createIcons();
}

/* =========================================================
   ASISTENTE CONVERSACIONAL
   ========================================================= */
function usarPromptRapido(texto) {
  document.getElementById('input-chat-comprador').value = texto;
}

async function enviarMensajeComprador(e) {
  e.preventDefault();
  const input = document.getElementById('input-chat-comprador');
  const texto = input.value.trim();
  if (!texto) return;

  agregarBurbuja('chat-messages-comprador', texto, 'user');
  input.value = '';

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'COMPRADOR',
        mensaje: texto,
        contextoProductos: inventarioLocal.filter(p => p.stock > 0)
      })
    });
    const data = await resp.json();
    agregarBurbuja('chat-messages-comprador', data.mensaje_usuario || 'Consulta procesada.', 'bot');
  } catch {
    agregarBurbuja('chat-messages-comprador', 'Error al conectar con el asistente.', 'bot');
  }
}

function mostrarPreviewFoto(input) {
  if (!input.files || !input.files[0]) return;
  document.getElementById('nombre-foto-vendedor').textContent = `Foto lista: ${input.files[0].name}`;
  document.getElementById('preview-foto-vendedor').classList.remove('hidden');
}

function limpiarFotoVendedor() {
  document.getElementById('foto-producto-ia').value = '';
  document.getElementById('preview-foto-vendedor').classList.add('hidden');
}

async function enviarMensajeVendedor(e) {
  e.preventDefault();
  const input = document.getElementById('input-chat-vendedor');
  const fileInput = document.getElementById('foto-producto-ia');
  const texto = input.value.trim();
  const archivo = fileInput.files?.[0];

  if (!texto && !archivo) return;

  agregarBurbuja('chat-messages-vendedor', texto || 'Imagen enviada para catalogar', 'user');
  input.value = '';

  let imagenBase64 = null;
  if (archivo) {
    imagenBase64 = await comprimirImagenBase64(archivo);
    limpiarFotoVendedor();
  }

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'VENDEDOR',
        mensaje: texto,
        imagenBase64,
        mimeType: 'image/jpeg',
        contextoProductos: inventarioLocal
      })
    });
    const resIA = await resp.json();

    if (resIA.accion === 'PUBLICAR' && resIA.datos) {
      const cat = resIA.datos.categoria || 'Producción Local';
      const subs = CATEGORIAS_CATALOGO[cat] || ['General'];
      const nuevo = {
        id: `prod-${Date.now()}`,
        nombre: resIA.datos.nombre || 'Artículo Nuevo',
        categoria: cat,
        subcategoria: resIA.datos.subcategoria || subs[0],
        precio: Number(resIA.datos.precio) || 0,
        stock: parseInt(resIA.datos.cantidad, 10) || 1,
        minimo: 5
      };
      inventarioLocal.push(nuevo);
      renderizarInventario();
      DB_HOOKS.crearProducto(nuevo);
    } else if (resIA.accion === 'MOVIMIENTO' && resIA.datos) {
      const target = inventarioLocal.find(
        p => p.id === resIA.datos.producto_id || p.nombre.toLowerCase().includes((resIA.datos.nombre || '').toLowerCase())
      );
      if (target) {
        const cant = parseInt(resIA.datos.cantidad, 10) || 1;
        if (resIA.datos.tipo_movimiento === 'ENTRADA') {
          target.stock += cant;
          entradasTurno += cant;
        } else {
          const descontado = Math.min(target.stock, cant);
          target.stock = Math.max(0, target.stock - cant);
          salidasTurno += descontado;
        }
        renderizarInventario();
        DB_HOOKS.registrarMovimientoInventario(target.id, resIA.datos.tipo_movimiento, cant);
      }
    }

    agregarBurbuja('chat-messages-vendedor', resIA.mensaje_usuario || 'Operación registrada.', 'bot');
  } catch {
    agregarBurbuja('chat-messages-vendedor', 'No se pudo procesar la operación con IA.', 'bot');
  }
}

function agregarBurbuja(contenedorId, texto, tipo) {
  const box = document.getElementById(contenedorId);
  const div = document.createElement('div');
  div.className = `msg msg-${tipo}`;
  div.textContent = texto;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* =========================================================
   NAVEGACION GENERAL Y MODALES
   ========================================================= */
document.querySelectorAll('#category-filters .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    renderizarSubcategoriasComprador(cat);
    MAP_HOOKS.filtrarPorCategoria(cat, 'todas');
  });
});

function cambiarTabVendedor(tabId, boton) {
  document.querySelectorAll('.seller-tab-content').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  boton.classList.add('active');
}

function abrirDetalleTienda(datosNegocio) {
  if (datosNegocio?.nombre) {
    document.getElementById('modal-tienda-nombre').textContent = datosNegocio.nombre;
  }
  document.getElementById('modal-tienda').classList.remove('hidden');
}

function abrirModalNuevoProducto() {
  actualizarSubcategoriasModal(document.getElementById('prod-categoria').value);
  document.getElementById('modal-nuevo-producto').classList.remove('hidden');
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Inicializar subcategorías del modal por defecto y restaurar sesión
actualizarSubcategoriasModal('Producción Local');

const sesionGuardada = localStorage.getItem('nexolocal_sesion');
if (sesionGuardada) {
  usuarioActual = JSON.parse(sesionGuardada);
  aplicarSesion();
}
