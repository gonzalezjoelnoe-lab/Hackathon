/* =====================================================================
   NexoLocal · Integración con Supabase
   Cargar DESPUÉS de app.js:  <script src="supabase-integration.js"></script>
   No reemplaza app.js: sobreescribe DB_HOOKS y unas pocas funciones.
   ===================================================================== */

/*
const SUPABASE_URL = 'https://sizgktvthrvijrpzqjve.supabase.co/rest/v1/';   // Project Settings > API
const SUPABASE_ANON_KEY = 'sb_publishable_rA3ZAagAc-IlwoASGxg4Ug_GSEXE7PD';     // la clave "anon public" (NUNCA la service_role)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
*/

const SUPABASE_URL = 'https://sizgktvthrvijrpzqjve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rA3ZAagAc-IlwoASGxg4Ug_GSEXE7PD';

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let datosReales = false;       // true cuando las tiendas vienen de la base de datos
let canalesRT = [];
const esDemo = () => !usuarioActual || usuarioActual.id === 'demo-user';

/* ---------- utilidades ---------- */
function contactoAEmail(contacto) {
  const v = contacto.trim().toLowerCase();
  if (v.includes('@')) return v;
  // Teléfono: se usa un correo "técnico" porque Supabase Auth por teléfono exige SMS.
  return `${v.replace(/\D/g, '')}@tel.nexolocal.app`;
}

function traducirErrorAuth(error) {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('already registered')) return 'Este correo o teléfono ya está registrado.';
  if (m.includes('invalid login')) return 'Credenciales incorrectas o cuenta no encontrada.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
  return error?.message || 'Ocurrió un error. Intenta de nuevo.';
}

const horaCorta = iso => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Ejecuta una operación de BD; en modo demo solo registra en consola
async function ejecutar(nombre, fn) {
  if (esDemo()) { console.log('[demo] no se sincroniza:', nombre); return { data: null }; }
  try {
    const res = await fn();
    if (res?.error) { console.error(nombre, res.error); return { error: res.error.message }; }
    return { data: res.data };
  } catch (e) {
    console.error(nombre, e);
    return { error: e.message };
  }
}

async function cargarPerfil(uid) {
  const { data: p, error } = await sb.from('perfiles').select('*').eq('id', uid).single();
  if (error || !p) return { error: 'No se encontró tu perfil.' };
  let negocioId = null;
  if (p.rol === 'vendedor') {
    const { data: n } = await sb.from('negocios').select('id').eq('dueno_id', uid).maybeSingle();
    negocioId = n?.id || null;
  }
  return {
    data: {
      id: p.id, nombre: p.nombre, contacto: p.contacto, rol: p.rol,
      giro: p.giro, whatsapp: p.whatsapp, verificado: p.verificado, negocioId
    }
  };
}

/* ---------- mapeo BD → formato que usa app.js ---------- */
function productoDBaLocal(p) {
  return {
    id: p.id, nombre: p.nombre, categoria: p.categoria, subcategoria: p.subcategoria,
    unidad: p.unidad, precio: Number(p.precio), stock: Number(p.stock), minimo: Number(p.minimo)
  };
}

function negocioATienda(n) {
  return {
    id: n.id,
    nombre: n.nombre,
    categoria: n.categoria || 'Tiendas y Abarrotes',
    descripcion: n.descripcion || '',
    offsetLat: 0.002,
    offsetLng: 0.002,
    sinUbicacion: n.lat == null || n.lng == null,
    coords: [Number(n.lat ?? 24.0298), Number(n.lng ?? -104.6506)],
    distanciaKm: 0,
    calificacion: Number(n.calificacion_promedio || 0),
    resenasCount: n.resenas_count || 0,
    abierto: n.abierto,
    horario: n.horario || '',
    ventasTotales: n.ventas_totales || 0,
    promocionado: n.promocionado,
    planPromo: n.plan_promo,
    verificado: n.verificado,
    productos: (n.productos || []).filter(p => p.activo !== false).map(productoDBaLocal)
  };
}

function pedidoDBaLocal(p) {
  return {
    id: p.codigo,                 // la UI muestra y usa el código
    dbId: p.id,
    tiendaId: p.negocio_id,
    tiendaNombre: p.negocios?.nombre || 'Negocio',
    compradorNombre: p.comprador_nombre || 'Comprador',
    items: (p.pedido_items || []).map(i => ({
      prodKey: i.producto_id, nombre: i.nombre, unidad: i.unidad,
      precio: Number(i.precio), cantidad: Number(i.cantidad)
    })),
    total: Number(p.total),
    metodoPago: p.metodo_pago === 'online' ? 'Pagado en línea' : 'Pagar en tienda al recoger',
    pagadoOnline: p.metodo_pago === 'online' && p.pagado,
    estado: p.estado,
    horaCreacion: horaCorta(p.creado_en),
    horaActualizacion: horaCorta(p.actualizado_en)
  };
}

/* ---------- carga de datos ---------- */
async function recargarTiendas() {
  if (esDemo()) return;
  const { data, error } = await sb.from('negocios').select('*, productos(*)').eq('productos.activo', true);
  if (error) { console.error('negocios', error); return; }
  if (!data.length) return;   // sin negocios aún: se conservan los de demostración

  datosReales = true;
  const propio = usuarioActual?.negocioId;
  const tiendas = data.map(negocioATienda).filter(t => !t.sinUbicacion || t.id === propio);
  tiendasRegistradas.splice(0, tiendasRegistradas.length, ...tiendas);

  if (propio) {
    const mia = tiendas.find(t => t.id === propio);
    if (mia) inventarioLocal = mia.productos;   // misma referencia que tienda.productos
  }
  recalcularDistanciasTiendas();
  refrescarVistasActuales();
}

async function recargarPedidos() {
  if (esDemo()) return;
  let q = sb.from('pedidos').select('*, negocios(nombre), pedido_items(*)').order('creado_en', { ascending: false });
  q = (usuarioActual.rol === 'vendedor' && usuarioActual.negocioId)
    ? q.eq('negocio_id', usuarioActual.negocioId)
    : q.eq('comprador_id', usuarioActual.id);
  const { data, error } = await q;
  if (error) { console.error('pedidos', error); return; }
  pedidosClientes = data.map(pedidoDBaLocal);
  guardarPedidosClientesLocal();   // re-renderiza vendedor/comprador y badges
}

async function cargarTemporada() {
  if (!usuarioActual?.negocioId) return;
  const { data } = await sb.from('temporada_config').select('*').eq('negocio_id', usuarioActual.negocioId).maybeSingle();
  if (data) {
    modoTemporadaAltaActivo = data.activo;
    stocksTemporadaEditados = data.stocks_programados || {};
    productosExcluidosTemporada = data.excluidos || [];
  }
}

function refrescarVistasActuales() {
  if (!usuarioActual) return;
  if (usuarioActual.rol === 'vendedor') {
    renderizarInventario();
    renderizarSeccionTemporadaAlta();
    actualizarListaReabastecimiento();
    actualizarEstadoPromocionVendedor();
  } else if (MAP_HOOKS.mapInstance) {
    const sinFiltro = categoriaMapaActiva === 'todos' && !document.getElementById('map-search')?.value;
    if (sinFiltro) MAP_HOOKS.renderizarMarcadores(tiendasRegistradas);
    renderizarDirectorioTiendas();
  }
}

async function ofrecerUbicacionNegocio() {
  if (usuarioActual?.rol !== 'vendedor' || !usuarioActual.negocioId) return;
  const mia = tiendasRegistradas.find(t => t.id === usuarioActual.negocioId);
  if (!mia || !mia.sinUbicacion) return;
  if (!confirm('Tu negocio aún no tiene ubicación en el mapa. ¿Usar tu ubicación actual?')) return;
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { error } = await sb.from('negocios')
        .update({ lat: pos.coords.latitude, lng: pos.coords.longitude }).eq('id', mia.id);
      if (error) { alert('No se pudo guardar la ubicación.'); return; }
      mia.coords = [pos.coords.latitude, pos.coords.longitude];
      mia.sinUbicacion = false;
    },
    () => alert('No se pudo obtener tu ubicación. Activa el permiso del navegador.')
  );
}

function suscribirRealtime() {
  canalesRT.forEach(c => sb.removeChannel(c));
  canalesRT = [
    sb.channel('nx-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, debounce(recargarPedidos, 500))
      .subscribe(),
    sb.channel('nx-productos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, debounce(recargarTiendas, 800))
      .subscribe()
  ];
}

async function cargarDatosUsuario() {
  await recargarTiendas();
  await Promise.all([recargarPedidos(), cargarTemporada()]);
  suscribirRealtime();
  ofrecerUbicacionNegocio();
}

/* ---------- DB_HOOKS reales ---------- */
Object.assign(DB_HOOKS, {
  async registrarUsuario(d) {
    const { data, error } = await sb.auth.signUp({
      email: contactoAEmail(d.contacto),
      password: d.password,
      options: { data: { nombre: d.nombre, contacto: d.contacto, rol: d.rol, giro: d.giro, whatsapp: d.whatsapp } }
    });
    if (error) return { error: traducirErrorAuth(error) };
    if (!data.session) return { error: 'Cuenta creada. Confirma tu correo y luego inicia sesión.' };
    return cargarPerfil(data.user.id);   // el trigger ya creó perfil (y negocio si es vendedor)
  },

  async autenticarUsuario(contacto, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: contactoAEmail(contacto), password });
    if (error) return { error: traducirErrorAuth(error) };
    return cargarPerfil(data.user.id);
  },

  async registrarMovimientoInventario(productoId, tipo, cantidad) {
    const r = await ejecutar('registrar_movimiento', () =>
      sb.rpc('registrar_movimiento', { p_producto: productoId, p_tipo: tipo, p_cantidad: cantidad, p_origen: 'manual' }));
    if (r.error) { alert('No se pudo registrar el movimiento: ' + r.error); recargarTiendas(); }
    return r;
  },

  async crearProducto(p) {
    const r = await ejecutar('crearProducto', () =>
      sb.from('productos').insert({
        negocio_id: usuarioActual.negocioId, nombre: p.nombre, categoria: p.categoria,
        subcategoria: p.subcategoria, unidad: p.unidad, precio: p.precio, stock: p.stock, minimo: p.minimo ?? 5
      }).select('id').single());
    if (r.error) { alert('No se pudo guardar el artículo: ' + r.error); return r; }
    if (r.data?.id) {          // p es el mismo objeto que está en inventarioLocal
      p.id = r.data.id;
      renderizarInventario();
      renderizarSeccionTemporadaAlta();
    }
    return r;
  },

  guardarVerificacionHumana(usuarioId, coords) {
    return ejecutar('verificacion', () =>
      sb.from('verificaciones').insert({ usuario_id: usuarioId, lat: coords?.lat ?? null, lng: coords?.lng ?? null }));
  },

  solicitarCategoria(pet) {
    return ejecutar('peticion_categoria', () =>
      sb.from('peticiones_categoria').insert({
        negocio_id: usuarioActual.negocioId, tipo: pet.tipo, padre: pet.padre,
        nombre: pet.nombre, unidades: pet.unidades, ejemplo: pet.ejemplo
      }));
  },

  guardarCalificacion(c) {
    return ejecutar('calificacion', () =>
      sb.from('calificaciones').insert({
        negocio_id: c.tiendaId, autor_id: usuarioActual.id, autor_nombre: c.autor,
        estrellas: c.estrellas, comentario: c.comentario
      }));
  },

  guardarBusquedaReciente(termino, tipo) {
    return ejecutar('busqueda', () =>
      sb.from('busquedas_recientes').insert({ user_id: usuarioActual.id, termino, tipo }));
  },

  async activarPromocion(_tiendaId, plan) {
    const r = await ejecutar('activar_promocion', () => sb.rpc('activar_promocion', { p_plan: plan }));
    if (r.error) alert('No se pudo activar la promoción: ' + r.error);
    return r;
  },

  guardarProgramacionTemporada(activo, stocks, excluidos) {
    if (!usuarioActual?.negocioId) return Promise.resolve({ data: null });
    return ejecutar('temporada', () =>
      sb.from('temporada_config').upsert({
        negocio_id: usuarioActual.negocioId, activo, stocks_programados: stocks,
        excluidos, actualizado_en: new Date().toISOString()
      }, { onConflict: 'negocio_id' }));
  },

  registrarSolicitudProveedor(ordenes) {
    return ejecutar('solicitud_proveedor', () =>
      sb.from('solicitudes_proveedor').insert(ordenes.map(o => ({
        negocio_id: usuarioActual.negocioId, producto_id: o.productoId,
        nombre: o.nombre, cantidad: o.cantidad, unidad: o.unidad
      }))));
  },

  // { tiendaId, items:[{prodKey, cantidad,...}], metodoPago }
  crearPedidoCliente({ tiendaId, items, metodoPago }) {
    return ejecutar('crear_pedido', () =>
      sb.rpc('crear_pedido', {
        p_negocio: tiendaId,
        p_items: items.map(i => ({ producto_id: i.prodKey, cantidad: i.cantidad })),
        p_metodo: metodoPago
      }));
  },

  actualizarEstadoPedido(codigo, nuevoEstado) {
    return ejecutar('estado_pedido', () =>
      sb.rpc('actualizar_estado_pedido', { p_codigo: codigo, p_estado: nuevoEstado }));
  }
});

/* ---------- funciones de app.js que se ajustan ---------- */

// Con datos reales, cada negocio ya trae su propio catálogo
window.obtenerProductosTienda = function (tienda) {
  return tienda?.productos || [];
};

window.obtenerTiendaDelVendedor = function () {
  return tiendasRegistradas.find(t => t.id === usuarioActual?.negocioId) || tiendasRegistradas[0];
};

// Con datos reales no se re-anclan las tiendas alrededor del usuario: solo se mide distancia
const recalcularDistanciasBase = window.recalcularDistanciasTiendas;
window.recalcularDistanciasTiendas = function () {
  if (!datosReales) return recalcularDistanciasBase();
  tiendasRegistradas.forEach(t => {
    t.distanciaKm = Math.max(0.1, calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, t.coords[0], t.coords[1]));
  });
};

// Carga datos reales antes de pintar la sesión
const aplicarSesionBase = window.aplicarSesion;
window.aplicarSesion = async function () {
  const real = usuarioActual && !esDemo();
  if (real) await cargarDatosUsuario();
  const nombres = tiendasRegistradas.map(t => t.nombre);
  aplicarSesionBase();
  // aplicarSesionBase renombra tiendasRegistradas[0] con el usuario; se restaura con datos reales
  if (real) tiendasRegistradas.forEach((t, i) => { t.nombre = nombres[i]; });
  // El cambio de rol rápido es solo para el modo demo; un rol real lo define la BD
  document.getElementById('btn-switch-role')?.classList.toggle('hidden', real);
};

window.cerrarSesion = async function () {
  if (!esDemo()) await sb.auth.signOut();
  localStorage.removeItem('nexolocal_sesion');
  location.reload();
};

const avanzarEstadoPedidoBase = window.avanzarEstadoPedido;
window.avanzarEstadoPedido = async function (pedidoId, nuevoEstado) {
  if (esDemo()) return avanzarEstadoPedidoBase(pedidoId, nuevoEstado);
  const r = await DB_HOOKS.actualizarEstadoPedido(pedidoId, nuevoEstado);
  if (r.error) { alert(r.error); return; }
  await recargarPedidos();
};

const confirmarPedidoCarritoBase = window.confirmarPedidoCarrito;
window.confirmarPedidoCarrito = async function () {
  if (esDemo()) return confirmarPedidoCarritoBase();

  const msgBox = document.getElementById('cart-checkout-msg');
  const avisar = texto => { if (msgBox) { msgBox.textContent = texto; msgBox.classList.remove('hidden'); } };
  if (msgBox) msgBox.classList.add('hidden');
  if (carritoCompras.length === 0) return;

  if (metodoPagoSeleccionado === 'online') {
    const titular = document.getElementById('pago-titular')?.value.trim();
    const terminacion = document.getElementById('pago-terminacion')?.value.trim();
    if (!titular || !terminacion || terminacion.length < 4) {
      avisar('Ingresa el nombre del titular y los últimos 4 dígitos de tu tarjeta para procesar el pago en línea.');
      return;
    }
  }

  const porTienda = {};
  carritoCompras.forEach(i => { (porTienda[i.tiendaId] ||= []).push(i); });

  for (const [tiendaId, items] of Object.entries(porTienda)) {
    const r = await DB_HOOKS.crearPedidoCliente({ tiendaId, items, metodoPago: metodoPagoSeleccionado });
    if (r.error) {
      avisar(r.error);
      await recargarTiendas();
      renderizarCarrito();
      return;
    }
    carritoCompras = carritoCompras.filter(i => i.tiendaId !== tiendaId);
  }

  guardarCarritoLocal();
  await Promise.all([recargarTiendas(), recargarPedidos()]);
  cambiarTabModalCarrito('pedidos');
};

/* ---------- restaurar sesión al abrir la página ---------- */
(async () => {
  const { data } = await sb.auth.getSession();
  if (!data.session) return;
  const r = await cargarPerfil(data.session.user.id);
  if (r.data) {
    usuarioActual = r.data;
    await aplicarSesion();
  }
})();
