lucide.createIcons();

let rolRegistro = 'comprador';
let usuarioActual = null;
let totalMovimientosTurno = 0;

let inventarioLocal = [
  { id: 'demo-1', nombre: 'Artículo de Muestra', categoria: 'General', precio: 120.00, stock: 10, minimo: 5 }
];

/* =========================================================
   APARTADO DE CONEXION A BASE DE DATOS (SUPABASE)
   Integrante de BD: pega aquí tu cliente Supabase y conecta
   las consultas dentro de DB_HOOKS.
   ========================================================= */
const DB_HOOKS = {
  async registrarUsuario(datosUsuario) {
    // Conectar: const { data, error } = await supabase.from('usuarios').insert(datosUsuario).select().single();
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
    // Conectar: const { data, error } = await supabase.from('usuarios').select('*').eq('contacto', contacto).eq('password', password).single();
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
    // Conectar: actualizar stock_actual en 'productos' e insertar en 'movimientos_inventario'
    console.log('Sincronizar en Supabase:', { productoId, tipo, cantidad });
  },

  async crearProducto(datosProducto) {
    // Conectar: supabase.from('productos').insert(datosProducto)
    console.log('Insertar producto en Supabase:', datosProducto);
  },

  async guardarVerificacionHumana(usuarioId, coordenadas) {
    // Conectar: supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId)
    console.log('Guardar verificación en Supabase:', { usuarioId, coordenadas });
  }
};

/* =========================================================
   APARTADO DE CONEXION AL MAPA (LEAFLET)
   ========================================================= */
const MAP_HOOKS =  {
  mapInstance: null,
  inicializar() {
    // Integrante de Mapa: inicializar L.map('map') aquí
    const map = L.map('map').setView([24.0298, -104.6506], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
  },
  filtrarPorCategoria(categoria) {
    console.log('Filtrar marcadores por:', categoria);
  }
};

/* =========================================================
   VALIDACION ESTRICTA DE NUMEROS
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

  const datos = {
    nombre: document.getElementById('reg-nombre').value.trim(),
    contacto: document.getElementById('reg-contacto').value.trim(),
    password: document.getElementById('reg-password').value,
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
   INVENTARIO CON ENTRADAS Y SALIDAS POR CANTIDAD EXACTA
   ========================================================= */
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
      <td>${item.categoria}</td>
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
  document.getElementById('kpi-movimientos').textContent = `${totalMovimientosTurno} uds movidas`;
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
  } else {
    producto.stock = Math.max(0, producto.stock - cantidad);
  }

  totalMovimientosTurno += cantidad;
  renderizarInventario();
  DB_HOOKS.registrarMovimientoInventario(productoId, tipo, cantidad);
}

function guardarProductoManual(event) {
  event.preventDefault();
  const nombre = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value;
  const precio = parseFloat(document.getElementById('prod-precio').value) || 0;
  const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;

  const nuevo = {
    id: `prod-${Date.now()}`,
    nombre,
    categoria,
    precio,
    stock,
    minimo: 5
  };

  inventarioLocal.push(nuevo);
  renderizarInventario();
  DB_HOOKS.crearProducto(nuevo);
  cerrarModal('modal-nuevo-producto');
  event.target.reset();
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
   ASISTENTE CONVERSACIONAL (ANALISIS DE CATALOGO Y OPERACION)
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
      const nuevo = {
        id: `prod-${Date.now()}`,
        nombre: resIA.datos.nombre || 'Artículo Nuevo',
        categoria: resIA.datos.categoria || 'Producción Local',
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
        } else {
          target.stock = Math.max(0, target.stock - cant);
        }
        totalMovimientosTurno += cant;
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
    MAP_HOOKS.filtrarPorCategoria(chip.dataset.cat);
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
  document.getElementById('modal-nuevo-producto').classList.remove('hidden');
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Restaurar sesión si ya había iniciado
const sesionGuardada = localStorage.getItem('nexolocal_sesion');
if (sesionGuardada) {
  usuarioActual = JSON.parse(sesionGuardada);
  aplicarSesion();
}
