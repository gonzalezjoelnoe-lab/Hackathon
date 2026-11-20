lucide.createIcons();

let rolRegistro = 'comprador';
let usuarioActual = null;
let entradasTurno = 0;
let salidasTurno = 0;
let estrellaSeleccionada = 5;
let filtroTiendaActivo = 'todos';
let tiendaSeleccionadaModal = null;
let categoriaMapaActiva = 'todos';
let subcategoriaMapaActiva = 'todas';

// Estado de Geolocalización del Comprador
let ubicacionUsuario = {
  lat: 24.0298,
  lng: -104.6506,
  autorizada: false,
  origen: 'default'
};
let modoPinManualActivo = false;

// Estado de Temporada Alta del Vendedor
let modoTemporadaAltaActivo = JSON.parse(localStorage.getItem('nexolocal_temporada_activa') || 'false');
let stocksTemporadaEditados = JSON.parse(localStorage.getItem('nexolocal_stocks_temporada') || '{}');
let productosExcluidosTemporada = JSON.parse(localStorage.getItem('nexolocal_excluidos_temporada') || '[]');
let solicitudesProveedores = JSON.parse(localStorage.getItem('nexolocal_solicitudes_prov') || '{}');

// Estado de Carrito (solo comprador, no se envía al vendedor hasta confirmar pago) y Pedidos Activos
let carritoCompras = JSON.parse(localStorage.getItem('nexolocal_carrito') || '[]');
let pedidosClientes = JSON.parse(localStorage.getItem('nexolocal_pedidos_clientes') || '[]');
let metodoPagoSeleccionado = 'online';

const UMBRAL_VENTAS_RECOMENDADO = 20;

const CATEGORIAS_CATALOGO = {
  'Producción Local': [
    'Frutas y Hortalizas',
    'Miel y Derivados',
    'Lácteos y Quesos',
    'Granos y Semillas',
    'Panadería Artesanal',
    'Conservas y Salsas'
  ],
  'Tiendas y Abarrotes': [
    'Despensa Básica',
    'Lácteos y Quesos',
    'Bebidas y Refrescos',
    'Jugos y Bebidas Naturales',
    'Bebidas Alcohólicas',
    'Botanas y Frituras',
    'Carnes y Embutidos',
    'Limpieza del Hogar',
    'Cuidado Personal'
  ],
  'Alimentos Preparados': [
    'Antojitos y Comida Corrida',
    'Tortillería y Masa',
    'Repostería y Postres',
    'Jugos y Aguas Frescas',
    'Café y Bebidas Calientes'
  ],
  'Insumos y Papelería': [
    'Papelería Escolar',
    'Material de Oficina',
    'Empaques y Desechables',
    'Mercería y Costura',
    'Insumos Agrícolas'
  ],
  'Ferretería y Construcción': [
    'Tornillería y Fijación',
    'Pinturas y Solventes',
    'Plomería y Tubería',
    'Material Eléctrico',
    'Materiales a Granel'
  ],
  'Talleres y Oficios': [
    'Artesanías Locales',
    'Carpintería y Madera',
    'Textiles y Bordado',
    'Herrería y Soldadura',
    'Talabartería y Calzado'
  ],
  'Vivero y Jardinería': [
    'Plantas de Ornato',
    'Árboles Frutales',
    'Tierra y Fertilizantes',
    'Macetas y Herramientas'
  ]
};

const UNIDADES_POR_SUBCATEGORIA = {
  'Frutas y Hortalizas': ['kg', 'ton', 'g', 'pz', 'caja', 'costal'],
  'Granos y Semillas': ['kg', 'ton', 'costal', 'g', 'bolsa'],
  'Carnes y Embutidos': ['kg', 'g', 'paquete', 'pz'],
  'Miel y Derivados': ['lt', 'ml', 'kg', 'pz', 'frasco'],
  'Lácteos y Quesos': ['kg', 'lt', 'ml', 'pz', 'galón'],
  'Bebidas y Refrescos': ['pz', 'lt', 'ml', 'paquete', 'caja', 'garrafón'],
  'Jugos y Bebidas Naturales': ['lt', 'ml', 'pz', 'galón', 'paquete'],
  'Bebidas Alcohólicas': ['pz', 'botella', 'paquete', 'caja', 'lt'],
  'Jugos y Aguas Frescas': ['lt', 'ml', 'galón', 'pz'],
  'Limpieza del Hogar': ['lt', 'ml', 'galón', 'pz', 'bolsa'],
  'Pinturas y Solventes': ['lt', 'ml', 'galón', 'cubeta', 'pz'],
  'Botanas y Frituras': ['pz', 'paquete', 'caja', 'bolsa'],
  'Panadería Artesanal': ['pz', 'charola', 'paquete', 'docena'],
  'Tortillería y Masa': ['kg', 'paquete', 'pz'],
  'Materiales a Granel': ['ton', 'kg', 'costal', 'm³'],
  'Plomería y Tubería': ['pz', 'metro', 'tramo', 'caja'],
  'Material Eléctrico': ['metro', 'rollo', 'pz', 'caja'],
  'Tierra y Fertilizantes': ['kg', 'costal', 'ton', 'lt', 'bolsa']
};

const TODAS_LAS_UNIDADES = [
  'pz', 'kg', 'g', 'ton', 'lt', 'ml', 'galón', 'paquete', 'caja', 'bolsa', 'costal', 'docena', 'botella', 'garrafón', 'metro', 'rollo'
];

const UNIDADES_CONTINUAS = new Set(['kg', 'g', 'ton', 'lt', 'ml', 'metro', 'm³']);

let inventarioLocal = [
  {
    id: 'demo-1',
    nombre: 'Tomate Saladette Fresco',
    categoria: 'Producción Local',
    subcategoria: 'Frutas y Hortalizas',
    unidad: 'kg',
    precio: 24.50,
    stock: 45,
    minimo: 10
  },
  {
    id: 'demo-2',
    nombre: 'Miel de Abeja Multiflora',
    categoria: 'Producción Local',
    subcategoria: 'Miel y Derivados',
    unidad: 'lt',
    precio: 140.00,
    stock: 12,
    minimo: 5
  },
  {
    id: 'demo-3',
    nombre: 'Papas Fritas Caseras 150g',
    categoria: 'Tiendas y Abarrotes',
    subcategoria: 'Botanas y Frituras',
    unidad: 'pz',
    precio: 18.00,
    stock: 30,
    minimo: 8
  },
  {
    id: 'demo-4',
    nombre: 'Maíz Blanco Criollo',
    categoria: 'Producción Local',
    subcategoria: 'Granos y Semillas',
    unidad: 'costal',
    precio: 480.00,
    stock: 4,
    minimo: 5
  }
];

// Historial mensual de salidas del negocio para detección automática de Temporada Alta
let historialVentasMensual = [
  {
    mes: 'Enero - Febrero',
    etiqueta: 'Inicio de Año',
    ventasPorProducto: { 'demo-1': 32, 'demo-2': 8, 'demo-3': 24, 'demo-4': 4 }
  },
  {
    mes: 'Marzo - Abril',
    etiqueta: 'Primavera',
    ventasPorProducto: { 'demo-1': 38, 'demo-2': 9, 'demo-3': 28, 'demo-4': 5 }
  },
  {
    mes: 'Mayo - Junio',
    etiqueta: 'Cosecha y Calor',
    ventasPorProducto: { 'demo-1': 64, 'demo-2': 14, 'demo-3': 46, 'demo-4': 7 }
  },
  {
    mes: 'Julio - Agosto',
    etiqueta: 'Verano',
    ventasPorProducto: { 'demo-1': 41, 'demo-2': 10, 'demo-3': 35, 'demo-4': 5 }
  },
  {
    mes: 'Septiembre - Octubre',
    etiqueta: 'Otoño',
    ventasPorProducto: { 'demo-1': 44, 'demo-2': 13, 'demo-3': 33, 'demo-4': 6 }
  },
  {
    mes: 'Noviembre - Diciembre',
    etiqueta: 'Fin de Año y Fiestas',
    ventasPorProducto: { 'demo-1': 78, 'demo-2': 24, 'demo-3': 58, 'demo-4': 12 }
  }
];

let tiendasRegistradas = [
  {
    id: 'tienda-1',
    nombre: 'Productores y Abarrotes del Centro',
    categoria: 'Producción Local',
    descripcion: 'Venta directa sin intermediarios con existencias actualizadas al momento.',
    offsetLat: 0.0018,
    offsetLng: -0.0014,
    coords: [24.0298, -104.6506],
    distanciaKm: 0.4,
    calificacion: 4.8,
    resenasCount: 14,
    abierto: true,
    horario: 'Cierra 20:00',
    ventasTotales: 28,
    promocionado: false,
    planPromo: null,
    verificado: true,
    productos: inventarioLocal
  },
  {
    id: 'tienda-2',
    nombre: 'Huerta y Mieles del Valle',
    categoria: 'Producción Local',
    descripcion: 'Cosecha orgánica de temporada, miel virgen y conservas artesanales.',
    offsetLat: 0.0042,
    offsetLng: 0.0031,
    coords: [24.0322, -104.6475],
    distanciaKm: 1.1,
    calificacion: 4.9,
    resenasCount: 31,
    abierto: true,
    horario: 'Cierra 19:30',
    ventasTotales: 16,
    promocionado: true,
    planPromo: 'Destacado Semanal',
    verificado: true,
    productos: [
      { id: 't2-1', nombre: 'Miel de Mezquite 1L', categoria: 'Producción Local', subcategoria: 'Miel y Derivados', precio: 155.00, stock: 18, unidad: 'lt' },
      { id: 't2-2', nombre: 'Manzana Canatlán', categoria: 'Producción Local', subcategoria: 'Frutas y Hortalizas', precio: 32.00, stock: 60, unidad: 'kg' }
    ]
  },
  {
    id: 'tienda-3',
    nombre: 'Panadería Artesanal El Maíz',
    categoria: 'Alimentos Preparados',
    descripcion: 'Pan de masa madre, empanadas de cajeta y repostería recién horneada.',
    offsetLat: -0.0029,
    offsetLng: 0.0022,
    coords: [24.0281, -104.6488],
    distanciaKm: 0.7,
    calificacion: 4.9,
    resenasCount: 45,
    abierto: true,
    horario: 'Cierra 21:00',
    ventasTotales: 54,
    promocionado: false,
    planPromo: null,
    verificado: true,
    productos: [
      { id: 't3-1', nombre: 'Bolillo Artesanal', categoria: 'Alimentos Preparados', subcategoria: 'Panadería Artesanal', precio: 6.00, stock: 80, unidad: 'pz' },
      { id: 't3-2', nombre: 'Charola Pan Dulce Surtido', categoria: 'Alimentos Preparados', subcategoria: 'Panadería Artesanal', precio: 110.00, stock: 9, unidad: 'charola' }
    ]
  },
  {
    id: 'tienda-4',
    nombre: 'Ferretería e Insumos Guadiana',
    categoria: 'Ferretería y Construcción',
    descripcion: 'Material eléctrico, plomería y herramienta ligera al menudeo y mayoreo.',
    offsetLat: -0.0065,
    offsetLng: -0.0058,
    coords: [24.0274, -104.6540],
    distanciaKm: 1.8,
    calificacion: 4.5,
    resenasCount: 9,
    abierto: true,
    horario: 'Cierra 19:00',
    ventasTotales: 11,
    promocionado: false,
    planPromo: null,
    verificado: true,
    productos: [
      { id: 't4-1', nombre: 'Cable Calibre 12', categoria: 'Ferretería y Construcción', subcategoria: 'Material Eléctrico', precio: 14.50, stock: 150, unidad: 'metro' },
      { id: 't4-2', nombre: 'Pintura Vinílica Blanca', categoria: 'Ferretería y Construcción', subcategoria: 'Pinturas y Solventes', precio: 340.00, stock: 7, unidad: 'galón' }
    ]
  },
  {
    id: 'tienda-5',
    nombre: 'Vivero y Tierra Fértil',
    categoria: 'Vivero y Jardinería',
    descripcion: 'Sustratos preparados, plantas de ornato y árboles frutales adaptados a la región.',
    offsetLat: 0.0145,
    offsetLng: -0.0112,
    coords: [24.0338, -104.6532],
    distanciaKm: 2.4,
    calificacion: 4.7,
    resenasCount: 19,
    abierto: true,
    horario: 'Cierra 18:30',
    ventasTotales: 14,
    promocionado: true,
    planPromo: 'Top Prioridad Mensual',
    verificado: true,
    productos: [
      { id: 't5-1', nombre: 'Tierra Preparada Negra', categoria: 'Vivero y Jardinería', subcategoria: 'Tierra y Fertilizantes', precio: 65.00, stock: 40, unidad: 'costal' },
      { id: 't5-2', nombre: 'Lavanda en Maceta', categoria: 'Vivero y Jardinería', subcategoria: 'Plantas de Ornato', precio: 45.00, stock: 22, unidad: 'pz' }
    ]
  },
  {
    id: 'tienda-6',
    nombre: 'Abarrotes y Cremería La Villista',
    categoria: 'Tiendas y Abarrotes',
    descripcion: 'Quesos menonitas, lácteos frescos, bebidas y surtido completo de despensa.',
    offsetLat: -0.0082,
    offsetLng: 0.0074,
    coords: [24.0259, -104.6461],
    distanciaKm: 1.5,
    calificacion: 4.6,
    resenasCount: 18,
    abierto: true,
    horario: 'Cierra 21:30',
    ventasTotales: 22,
    promocionado: false,
    planPromo: null,
    verificado: true,
    productos: [
      { id: 't6-1', nombre: 'Queso Menonita', categoria: 'Tiendas y Abarrotes', subcategoria: 'Lácteos y Quesos', precio: 168.00, stock: 14, unidad: 'kg' },
      { id: 't6-2', nombre: 'Leche Entera de Rancho', categoria: 'Tiendas y Abarrotes', subcategoria: 'Lácteos y Quesos', precio: 26.00, stock: 20, unidad: 'lt' },
      { id: 't6-3', nombre: 'Jugo de Naranja Natural 1L', categoria: 'Tiendas y Abarrotes', subcategoria: 'Jugos y Bebidas Naturales', precio: 34.00, stock: 15, unidad: 'lt' },
      { id: 't6-4', nombre: 'Cerveza Artesanal Six', categoria: 'Tiendas y Abarrotes', subcategoria: 'Bebidas Alcohólicas', precio: 185.00, stock: 11, unidad: 'paquete' }
    ]
  }
];

let busquedasRecientes = JSON.parse(localStorage.getItem('nexolocal_busquedas_recientes') || 'null') || [
  { texto: 'Tomate Saladette Fresco', tipo: 'Producto' },
  { texto: 'Queso Menonita', tipo: 'Producto' }
];

let resenasTienda = [
  { autor: 'Carlos Mendoza', estrellas: 5, comentario: 'Producto fresco del día y el stock que marcan sí coincide al llegar.' },
  { autor: 'Sofía Ramírez', estrellas: 5, comentario: 'Excelente atención directa y precios justos sin intermediarios.' }
];

let peticionesCategorias = JSON.parse(localStorage.getItem('nexolocal_peticiones_cat') || '[]');

/* =========================================================
   GEOLOCALIZACION EN TIEMPO REAL Y CALCULO DE DISTANCIAS (HAVERSINE)
   ========================================================= */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function recalcularDistanciasTiendas() {
  const distBase = calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, 24.0298, -104.6506);
  const anclarAlrededor = distBase > 25;

  tiendasRegistradas.forEach(t => {
    if (anclarAlrededor) {
      t.coords = [
        Number((ubicacionUsuario.lat + (t.offsetLat || 0.002)).toFixed(6)),
        Number((ubicacionUsuario.lng + (t.offsetLng || 0.002)).toFixed(6))
      ];
    }
    t.distanciaKm = Math.max(0.1, calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, t.coords[0], t.coords[1]));
  });
}

function actualizarUIEstadoUbicacion(estado, texto) {
  const pill = document.getElementById('geo-status-pill');
  const label = document.getElementById('geo-status-text');
  const banner = document.getElementById('geo-permission-banner');

  if (label) label.textContent = texto;
  if (pill) {
    pill.classList.toggle('active', estado === 'ok');
  }

  if (banner) {
    if (estado === 'ok') {
      banner.classList.add('hidden');
    } else {
      banner.classList.remove('hidden');
    }
  }
  lucide.createIcons();
}

function solicitarUbicacionUsuario(forzarAviso = false) {
  if (!('geolocation' in navigator)) {
    actualizarUIEstadoUbicacion('error', 'Sin GPS');
    return;
  }

  actualizarUIEstadoUbicacion('loading', 'Ubicando...');

  navigator.geolocation.getCurrentPosition(
    pos => {
      ubicacionUsuario = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        autorizada: true,
        origen: 'gps'
      };
      recalcularDistanciasTiendas();
      actualizarUIEstadoUbicacion('ok', 'Ubicación activa');

      if (MAP_HOOKS.mapInstance) {
        MAP_HOOKS.actualizarUbicacionUsuarioEnMapa(true);
        aplicarFiltroRadio();
      }
      renderizarDirectorioTiendas();
    },
    err => {
      ubicacionUsuario.autorizada = false;
      const msg = err.code === 1
        ? 'Permiso de ubicación denegado. Actívalo o marca tu punto en el mapa.'
        : 'No se pudo obtener tu señal GPS. Puedes marcar tu ubicación en el mapa.';
      const bannerText = document.getElementById('geo-banner-text');
      if (bannerText) bannerText.textContent = msg;
      actualizarUIEstadoUbicacion('error', 'Activar ubicación');

      if (forzarAviso && err.code === 1) {
        alert('Tu navegador tiene bloqueado el permiso de ubicación para este sitio. Habilítalo en el ícono de candado/ajustes de la barra de direcciones o usa "Marcar en mapa".');
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000
    }
  );
}

function activarModoPinManual() {
  modoPinManualActivo = !modoPinManualActivo;
  const btn = document.getElementById('btn-pin-manual');
  if (btn) {
    btn.classList.toggle('active-pin', modoPinManualActivo);
    btn.textContent = modoPinManualActivo ? 'Haz clic en el mapa...' : 'Marcar en mapa';
  }
}

function centrarEnUbicacionUsuario() {
  if (!ubicacionUsuario.autorizada && ubicacionUsuario.origen === 'default') {
    solicitarUbicacionUsuario(true);
    return;
  }
  if (MAP_HOOKS.mapInstance) {
    MAP_HOOKS.mapInstance.flyTo([ubicacionUsuario.lat, ubicacionUsuario.lng], 15, { duration: 0.7 });
  }
}

/* =========================================================
   TEMPORADA ALTA: DETECCION AUTOMATICA, SELECCION DE PRODUCTOS Y STOCK PROGRAMADO
   ========================================================= */
function calcularAnalisisIndividualProducto(item, temporadasNormales, temporadasAltas) {
  const ventasNormales = temporadasNormales.map(p => Number(p.ventasPorProducto[item.id] ?? Math.max(2, Math.round(item.minimo * 1.4))));
  const ventasPico = temporadasAltas.map(p => Number(p.ventasPorProducto[item.id] ?? Math.max(4, Math.round(item.minimo * 2.5))));

  const mediaNormal = ventasNormales.length
    ? ventasNormales.reduce((a, b) => a + b, 0) / ventasNormales.length
    : item.minimo;

  const mediaAlta = ventasPico.length
    ? ventasPico.reduce((a, b) => a + b, 0) / ventasPico.length
    : mediaNormal * 1.5;

  const esContinua = esUnidadContinua(item.unidad);
  const mediaNormalFmt = esContinua ? Math.round(mediaNormal * 10) / 10 : Math.round(mediaNormal);
  const mediaAltaFmt = esContinua ? Math.round(mediaAlta * 10) / 10 : Math.round(mediaAlta);

  const rawSugerido = mediaAlta * 1.15;
  const stockSugerido = esContinua
    ? Math.max(1, Math.round(rawSugerido * 10) / 10)
    : Math.max(1, Math.ceil(rawSugerido));

  const stockProgramado = stocksTemporadaEditados[item.id] !== undefined
    ? Number(stocksTemporadaEditados[item.id])
    : stockSugerido;

  return {
    item,
    mediaNormal: mediaNormalFmt,
    mediaAlta: mediaAltaFmt,
    stockSugerido,
    stockProgramado
  };
}

function analizarTemporadasAltas() {
  const resumenPeriodos = historialVentasMensual.map(periodo => {
    const totalUnidades = Object.values(periodo.ventasPorProducto).reduce((acc, v) => acc + Number(v || 0), 0);
    return {
      mes: periodo.mes,
      etiqueta: periodo.etiqueta,
      totalUnidades,
      ventasPorProducto: periodo.ventasPorProducto
    };
  });

  const promedioGlobal = resumenPeriodos.reduce((acc, p) => acc + p.totalUnidades, 0) / (resumenPeriodos.length || 1);

  resumenPeriodos.forEach(p => {
    const porcentaje = promedioGlobal > 0 ? Math.round(((p.totalUnidades - promedioGlobal) / promedioGlobal) * 100) : 0;
    p.deltaPorcentaje = porcentaje;
    p.esTemporadaAlta = porcentaje >= 20;
  });

  const temporadasAltas = resumenPeriodos.filter(p => p.esTemporadaAlta);
  const temporadasNormales = resumenPeriodos.filter(p => !p.esTemporadaAlta);

  const productosIncluidos = inventarioLocal.filter(item => !productosExcluidosTemporada.includes(item.id));
  const analisisProductos = productosIncluidos.map(item =>
    calcularAnalisisIndividualProducto(item, temporadasNormales, temporadasAltas)
  );

  analisisProductos.sort((a, b) => b.mediaAlta - a.mediaAlta);

  return { resumenPeriodos, temporadasAltas, temporadasNormales, analisisProductos };
}

function obtenerMetaMinimaEfectiva(item) {
  if (!modoTemporadaAltaActivo || productosExcluidosTemporada.includes(item.id)) {
    return item.minimo;
  }
  const { analisisProductos } = analizarTemporadasAltas();
  const hallado = analisisProductos.find(a => a.item.id === item.id);
  return hallado ? hallado.stockProgramado : item.minimo;
}

function renderizarSeccionTemporadaAlta() {
  const periodsContainer = document.getElementById('season-detected-periods');
  const tbody = document.getElementById('tabla-temporada-body');
  const toggleCheck = document.getElementById('toggle-temporada-activa');
  const badgeHero = document.getElementById('seller-season-badge');

  if (toggleCheck) toggleCheck.checked = modoTemporadaAltaActivo;
  if (badgeHero) badgeHero.classList.toggle('hidden', !modoTemporadaAltaActivo);

  const { resumenPeriodos, analisisProductos } = analizarTemporadasAltas();

  if (periodsContainer) {
    periodsContainer.innerHTML = resumenPeriodos.map(p => `
      <div class="season-period-card ${p.esTemporadaAlta ? 'peak' : ''}">
        <div class="season-period-top">
          <strong>${p.mes}</strong>
          <span class="season-delta-pill ${p.esTemporadaAlta ? '' : 'normal'}">
            ${p.esTemporadaAlta ? `Temporada Alta (+${p.deltaPorcentaje}%)` : `${p.deltaPorcentaje >= 0 ? '+' : ''}${p.deltaPorcentaje}% habitual`}
          </span>
        </div>
        <small>${p.etiqueta} · ${p.totalUnidades} unidades desplazadas en el periodo</small>
      </div>
    `).join('');
  }

  if (tbody) {
    if (analisisProductos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:1.5rem;">
            <span class="hint">No hay productos incluidos en la lista de Temporada Alta. Usa el botón <strong>"Modificar lista"</strong> para agregar artículos de tu inventario.</span>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = analisisProductos.map(({ item, mediaNormal, mediaAlta, stockSugerido, stockProgramado }) => {
      const unidad = item.unidad || 'pz';
      const faltante = Math.max(0, Math.round((stockProgramado - item.stock) * 100) / 100);

      return `
        <tr>
          <td>
            <strong>${item.nombre}</strong><br/>
            <small class="hint">${item.subcategoria} · Stock actual: ${item.stock} ${unidad}</small>
          </td>
          <td>${mediaNormal} <span class="unit-pill">${unidad}</span></td>
          <td><strong>${mediaAlta}</strong> <span class="unit-pill">${unidad}</span></td>
          <td><strong>${stockSugerido}</strong> <span class="unit-pill">${unidad}</span></td>
          <td>
            <div class="season-edit-wrap">
              <input
                type="text"
                inputmode="decimal"
                class="qty-input"
                id="season-input-${item.id}"
                value="${stockProgramado}"
                aria-label="Stock programado para ${item.nombre}"
                oninput="validarInputSegunUnidad(this, '${unidad}')"
                onchange="actualizarStockTemporadaItem('${item.id}', this, '${unidad}')"
              />
              <span class="unit-pill">${unidad}</span>
              <button
                type="button"
                class="btn-reset-mini"
                onclick="restaurarItemTemporada('${item.id}')"
                title="Volver al valor calculado por la media (${stockSugerido} ${unidad})"
              >
                <i data-lucide="rotate-ccw"></i>
              </button>
              <button
                type="button"
                class="btn-reset-mini danger"
                onclick="quitarProductoDeTemporada('${item.id}')"
                title="Quitar producto de la lista de temporada alta"
              >
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
          <td>
            ${faltante > 0
              ? `<span class="badge-danger">Pedir ${faltante} ${unidad}</span>`
              : `<span class="badge-ok">Cubierto (${item.stock} ${unidad})</span>`
            }
          </td>
        </tr>
      `;
    }).join('');
  }

  lucide.createIcons();
}

/* MODAL PARA AGREGAR O QUITAR PRODUCTOS DE INVENTARIO EN TEMPORADA ALTA */
function abrirModalModificarTemporada() {
  const busq = document.getElementById('buscar-producto-temporada-modal');
  if (busq) busq.value = '';
  renderizarListaModificarTemporada();
  document.getElementById('modal-modificar-temporada').classList.remove('hidden');
}

function renderizarListaModificarTemporada() {
  const contenedor = document.getElementById('lista-productos-modificar-temporada');
  if (!contenedor) return;

  const q = normalizarTextoBase(document.getElementById('buscar-producto-temporada-modal')?.value || '');
  const { temporadasNormales, temporadasAltas } = analizarTemporadasAltas();

  const filtrados = inventarioLocal.filter(item =>
    !q ||
    normalizarTextoBase(item.nombre).includes(q) ||
    normalizarTextoBase(item.subcategoria).includes(q)
  );

  if (filtrados.length === 0) {
    contenedor.innerHTML = `<div class="empty-box"><p>No se encontraron artículos en tu inventario con ese nombre.</p></div>`;
    return;
  }

  contenedor.innerHTML = filtrados.map(item => {
    const incluido = !productosExcluidosTemporada.includes(item.id);
    const analisis = calcularAnalisisIndividualProducto(item, temporadasNormales, temporadasAltas);

    return `
      <div class="season-manage-item ${incluido ? 'included' : ''}">
        <div>
          <strong>${item.nombre}</strong>
          <small>${item.categoria} · ${item.subcategoria} · Stock actual: ${item.stock} ${item.unidad} · Sugerido temporada: ${analisis.stockProgramado} ${item.unidad}</small>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="${incluido ? 'badge-ok' : 'badge-danger'}">${incluido ? 'Incluido' : 'Excluido'}</span>
          ${incluido
            ? `<button type="button" class="btn-card-mini danger" onclick="toggleProductoEnTemporada('${item.id}', false)"><i data-lucide="minus-circle"></i> Quitar</button>`
            : `<button type="button" class="btn-card-mini primary" onclick="toggleProductoEnTemporada('${item.id}', true)"><i data-lucide="plus-circle"></i> Agregar</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function toggleProductoEnTemporada(productoId, incluir) {
  if (incluir) {
    productosExcluidosTemporada = productosExcluidosTemporada.filter(id => id !== productoId);
  } else if (!productosExcluidosTemporada.includes(productoId)) {
    productosExcluidosTemporada.push(productoId);
  }
  localStorage.setItem('nexolocal_excluidos_temporada', JSON.stringify(productosExcluidosTemporada));

  renderizarListaModificarTemporada();
  renderizarSeccionTemporadaAlta();
  renderizarInventario();
  actualizarListaReabastecimiento();
  DB_HOOKS.guardarProgramacionTemporada(modoTemporadaAltaActivo, stocksTemporadaEditados, productosExcluidosTemporada);
}

function quitarProductoDeTemporada(productoId) {
  toggleProductoEnTemporada(productoId, false);
}

function actualizarStockTemporadaItem(productoId, input, unidad) {
  normalizarCantidadInput(input, unidad);
  const valor = esUnidadContinua(unidad) ? parseFloat(input.value) : parseInt(input.value, 10);
  stocksTemporadaEditados[productoId] = valor;
  localStorage.setItem('nexolocal_stocks_temporada', JSON.stringify(stocksTemporadaEditados));

  renderizarSeccionTemporadaAlta();
  if (modoTemporadaAltaActivo) {
    renderizarInventario();
    actualizarListaReabastecimiento();
  }
}

function restaurarItemTemporada(productoId) {
  delete stocksTemporadaEditados[productoId];
  localStorage.setItem('nexolocal_stocks_temporada', JSON.stringify(stocksTemporadaEditados));
  renderizarSeccionTemporadaAlta();
  if (modoTemporadaAltaActivo) {
    renderizarInventario();
    actualizarListaReabastecimiento();
  }
}

function restablecerSugerenciasTemporada() {
  stocksTemporadaEditados = {};
  localStorage.setItem('nexolocal_stocks_temporada', JSON.stringify({}));
  renderizarSeccionTemporadaAlta();
  if (modoTemporadaAltaActivo) {
    renderizarInventario();
    actualizarListaReabastecimiento();
  }
}

function alternarModoTemporadaAlta(activo) {
  modoTemporadaAltaActivo = activo;
  localStorage.setItem('nexolocal_temporada_activa', JSON.stringify(activo));
  renderizarSeccionTemporadaAlta();
  renderizarInventario();
  actualizarListaReabastecimiento();
  DB_HOOKS.guardarProgramacionTemporada(activo, stocksTemporadaEditados, productosExcluidosTemporada);
}

function guardarYGenerarResurtidoTemporada() {
  modoTemporadaAltaActivo = true;
  localStorage.setItem('nexolocal_temporada_activa', 'true');
  localStorage.setItem('nexolocal_stocks_temporada', JSON.stringify(stocksTemporadaEditados));

  renderizarSeccionTemporadaAlta();
  renderizarInventario();
  actualizarListaReabastecimiento();
  DB_HOOKS.guardarProgramacionTemporada(true, stocksTemporadaEditados, productosExcluidosTemporada);

  const msg = document.getElementById('season-feedback-msg');
  if (msg) {
    msg.textContent = 'Stock programado de Temporada Alta aplicado. Los artículos incluidos con faltante ya aparecen en Administración de Pedidos > Reabastecimiento a Proveedores.';
    msg.classList.remove('hidden');
  }
}

/* =========================================================
   REABASTECIMIENTO A PROVEEDORES (SOLICITAR UNO O SOLICITAR TODO)
   ========================================================= */
function obtenerFaltantesProveedores() {
  return inventarioLocal
    .map(item => {
      const meta = obtenerMetaMinimaEfectiva(item);
      const pedir = Math.max(0, Math.round((meta - item.stock) * 100) / 100);
      return { item, meta, pedir };
    })
    .filter(x => x.pedir > 0);
}

function actualizarListaReabastecimiento() {
  const contenedor = document.getElementById('lista-pedidos-proveedores');
  const btnTodo = document.getElementById('btn-solicitar-todo');
  if (!contenedor) return;

  const faltantes = obtenerFaltantesProveedores();

  // Limpiar solicitudes previas de productos cuyo stock ya fue cubierto
  const idsFaltantes = new Set(faltantes.map(f => f.item.id));
  let huboCambio = false;
  Object.keys(solicitudesProveedores).forEach(id => {
    if (!idsFaltantes.has(id)) {
      delete solicitudesProveedores[id];
      huboCambio = true;
    }
  });
  if (huboCambio) {
    localStorage.setItem('nexolocal_solicitudes_prov', JSON.stringify(solicitudesProveedores));
  }

  if (faltantes.length === 0) {
    if (btnTodo) btnTodo.classList.add('hidden');
    contenedor.innerHTML = `
      <div class="empty-box">
        <i data-lucide="refresh-cw"></i>
        <p>Todos los artículos cumplen actualmente con la meta de stock establecida.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const pendientesPorSolicitar = faltantes.filter(f => !solicitudesProveedores[f.item.id]);
  if (btnTodo) {
    btnTodo.classList.toggle('hidden', pendientesPorSolicitar.length === 0);
  }

  contenedor.innerHTML = faltantes.map(({ item, meta, pedir }) => {
    const yaSolicitado = solicitudesProveedores[item.id];
    return `
      <div class="restock-item ${yaSolicitado ? 'requested' : ''}">
        <div>
          <strong>${item.nombre}</strong>
          <small>Actual: ${item.stock} ${item.unidad} · Meta ${modoTemporadaAltaActivo ? 'Temporada Alta' : 'mínima'}: ${meta} ${item.unidad}</small>
        </div>
        <div class="restock-actions">
          <span class="badge-danger">+${pedir} ${item.unidad}</span>
          ${yaSolicitado
            ? `<span class="badge-ok"><i data-lucide="check"></i> Solicitado (${yaSolicitado.hora})</span>`
            : `<button type="button" class="btn-card-mini primary" onclick="solicitarReabastecimientoIndividual('${item.id}')">
                 <i data-lucide="send"></i> Solicitar
               </button>`
          }
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

async function solicitarReabastecimientoIndividual(productoId) {
  const faltante = obtenerFaltantesProveedores().find(f => f.item.id === productoId);
  if (!faltante) return;

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  solicitudesProveedores[productoId] = {
    productoId,
    nombre: faltante.item.nombre,
    cantidad: faltante.pedir,
    unidad: faltante.item.unidad,
    hora
  };
  localStorage.setItem('nexolocal_solicitudes_prov', JSON.stringify(solicitudesProveedores));

  await DB_HOOKS.registrarSolicitudProveedor([solicitudesProveedores[productoId]]);
  actualizarListaReabastecimiento();

  const fb = document.getElementById('reabastecimiento-feedback');
  if (fb) {
    fb.textContent = `Orden enviada a proveedor: +${faltante.pedir} ${faltante.item.unidad} de ${faltante.item.nombre}.`;
    fb.classList.remove('hidden');
  }
}

async function solicitarTodoProveedores() {
  const faltantes = obtenerFaltantesProveedores().filter(f => !solicitudesProveedores[f.item.id]);
  if (faltantes.length === 0) return;

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const lote = [];

  faltantes.forEach(f => {
    const reg = {
      productoId: f.item.id,
      nombre: f.item.nombre,
      cantidad: f.pedir,
      unidad: f.item.unidad,
      hora
    };
    solicitudesProveedores[f.item.id] = reg;
    lote.push(reg);
  });

  localStorage.setItem('nexolocal_solicitudes_prov', JSON.stringify(solicitudesProveedores));
  await DB_HOOKS.registrarSolicitudProveedor(lote);
  actualizarListaReabastecimiento();

  const fb = document.getElementById('reabastecimiento-feedback');
  if (fb) {
    fb.textContent = `Se envió la solicitud completa de ${lote.length} artículo(s) a tus proveedores.`;
    fb.classList.remove('hidden');
  }
}

/* =========================================================
   MOTOR DE BUSQUEDA FONETICA, ORTOGRAFICA Y SEMANTICA EN ESPAÑOL
   ========================================================= */
const SINONIMOS_INTENCION = [
  { disparadores: ['chela', 'cheve', 'caguama', 'pisto', 'vino', 'mezcal', 'tequila', 'licor', 'cerveza', 'alcohol', 'alcol', 'alcoholicas', 'alcolicas'], destino: 'Bebidas Alcohólicas' },
  { disparadores: ['chesco', 'refresco', 'soda', 'gaseosa'], destino: 'Bebidas y Refrescos' },
  { disparadores: ['jugo', 'jugos', 'nectar', 'agua fresca'], destino: 'Jugos y Bebidas Naturales' },
  { disparadores: ['queso', 'keso', 'qeso', 'crema', 'leche', 'lacteo', 'lacteos', 'yogurt'], destino: 'Lácteos y Quesos' },
  { disparadores: ['jitomate', 'tomate', 'tmate', 'verdura', 'hortaliza', 'fruta', 'manzana'], destino: 'Frutas y Hortalizas' },
  { disparadores: ['pan', 'bolillo', 'boliyo', 'concha', 'empanada', 'panaderia', 'reposteria'], destino: 'Panadería Artesanal' },
  { disparadores: ['tierra', 'abono', 'planta', 'maceta', 'jardin', 'vivero', 'bibero'], destino: 'Vivero y Jardinería' },
  { disparadores: ['cable', 'foco', 'tubo', 'pintura', 'ferreteria', 'fereteria', 'clavo'], destino: 'Ferretería y Construcción' },
  { disparadores: ['papas', 'botana', 'frituras', 'chucheria'], destino: 'Botanas y Frituras' }
];

function normalizarTextoBase(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarFoneticaES(texto) {
  let s = normalizarTextoBase(texto);
  if (!s) return '';
  s = s
    .replace(/qu/g, 'k')
    .replace(/q/g, 'k')
    .replace(/c([ei])/g, 's$1')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/ll/g, 'y')
    .replace(/h/g, '')
    .replace(/x/g, 's')
    .replace(/(.)\1+/g, '$1');
  return s;
}

function distanciaLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matriz = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + costo
      );
    }
  }
  return matriz[a.length][b.length];
}

function coincidenciaAproximada(consulta, objetivo) {
  const qNorm = normalizarTextoBase(consulta);
  const oNorm = normalizarTextoBase(objetivo);
  if (!qNorm || !oNorm) return false;

  if (oNorm.includes(qNorm)) return true;

  const qFon = normalizarFoneticaES(qNorm);
  const oFon = normalizarFoneticaES(oNorm);
  if (oFon.includes(qFon)) return true;

  const tokensQ = qFon.split(' ').filter(t => t.length >= 3);
  const tokensO = oFon.split(' ').filter(t => t.length >= 3);
  if (tokensQ.length === 0) return false;

  return tokensQ.every(tq =>
    tokensO.some(to => {
      if (to.includes(tq) || tq.includes(to)) return true;
      const maxErrores = Math.max(tq.length, to.length) >= 6 ? 2 : 1;
      return distanciaLevenshtein(tq, to) <= maxErrores;
    })
  );
}

function interpretarConsultaBusqueda(consultaRaw) {
  const qNorm = normalizarTextoBase(consultaRaw);
  const qFon = normalizarFoneticaES(consultaRaw);

  for (const regla of SINONIMOS_INTENCION) {
    const coincideSinonimo = regla.disparadores.some(d => {
      const dFon = normalizarFoneticaES(d);
      return qNorm.includes(d) || qFon.includes(dFon) || (qFon.length >= 4 && distanciaLevenshtein(qFon, dFon) <= 1);
    });
    if (coincideSinonimo) {
      return { terminoInterpretado: regla.destino, fueCorregido: qNorm !== normalizarTextoBase(regla.destino) };
    }
  }

  let mejorNombre = null;
  for (const tienda of tiendasRegistradas) {
    const prods = obtenerProductosTienda(tienda).filter(p => Number(p.stock) > 0);
    for (const p of prods) {
      if (coincidenciaAproximada(consultaRaw, p.subcategoria)) {
        mejorNombre = p.subcategoria;
        break;
      }
      if (coincidenciaAproximada(consultaRaw, p.nombre)) {
        mejorNombre = p.nombre;
        break;
      }
    }
    if (mejorNombre) break;
  }

  if (mejorNombre) {
    return {
      terminoInterpretado: mejorNombre,
      fueCorregido: normalizarTextoBase(mejorNombre) !== qNorm
    };
  }

  return { terminoInterpretado: consultaRaw.trim(), fueCorregido: false };
}

function obtenerProductosTienda(tienda) {
  if (!tienda) return [];
  return tienda.id === 'tienda-1' ? inventarioLocal : (tienda.productos || []);
}

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

  async registrarMovimientoInventario(productoId, tipo, cantidad, unidad) {
    console.log('Sincronizar en Supabase:', { productoId, tipo, cantidad, unidad });
  },

  async crearProducto(datosProducto) {
    console.log('Insertar producto en Supabase:', datosProducto);
  },

  async guardarVerificacionHumana(usuarioId, coordenadas) {
    console.log('Guardar verificación en Supabase:', { usuarioId, coordenadas });
  },

  async solicitarCategoria(peticion) {
    console.log('Enviar petición de categoría a Supabase:', peticion);
  },

  async guardarCalificacion(calificacion) {
    console.log('Guardar calificación en Supabase:', calificacion);
  },

  async guardarBusquedaReciente(termino, tipo) {
    console.log('Registrar búsqueda reciente en Supabase:', { termino, tipo });
  },

  async activarPromocion(tiendaId, plan) {
    console.log('Activar promoción en Supabase:', { tiendaId, plan });
  },

  async guardarProgramacionTemporada(activo, stocksProgramados, excluidos) {
    console.log('Sincronizar Temporada Alta en Supabase:', { activo, stocksProgramados, excluidos });
  },

  async registrarSolicitudProveedor(ordenes) {
    console.log('Registrar solicitud a proveedores en Supabase:', ordenes);
  },

  async crearPedidoCliente(pedido) {
    console.log('Crear pedido de cliente en Supabase:', pedido);
  },

  async actualizarEstadoPedido(pedidoId, nuevoEstado) {
    console.log('Actualizar estado de pedido en Supabase:', { pedidoId, nuevoEstado });
  }
};

/* =========================================================
   APARTADO DE CONEXION AL MAPA (LEAFLET) Y RADIO DE UBICACION
   ========================================================= */
const MAP_HOOKS = {
  mapInstance: null,
  markersById: {},
  userMarker: null,
  userRadiusCircle: null,
  ultimaListaFiltrada: tiendasRegistradas,

  inicializar() {
    if (this.mapInstance) return;
    this.mapInstance = L.map('map').setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapInstance);

    this.mapInstance.on('click', e => {
      if (!modoPinManualActivo) return;
      ubicacionUsuario = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        autorizada: true,
        origen: 'manual'
      };
      modoPinManualActivo = false;
      const btn = document.getElementById('btn-pin-manual');
      if (btn) {
        btn.classList.remove('active-pin');
        btn.textContent = 'Marcar en mapa';
      }
      recalcularDistanciasTiendas();
      actualizarUIEstadoUbicacion('ok', 'Ubicación fijada');
      this.actualizarUbicacionUsuarioEnMapa(true);
      aplicarFiltroRadio();
      renderizarDirectorioTiendas();
    });

    this.actualizarUbicacionUsuarioEnMapa(false);
    this.renderizarMarcadores(tiendasRegistradas);
  },

  actualizarUbicacionUsuarioEnMapa(centrar = false) {
    if (!this.mapInstance) return;
    const radioKm = parseFloat(document.getElementById('radius-filter')?.value || '5');
    const coords = [ubicacionUsuario.lat, ubicacionUsuario.lng];

    if (this.userMarker) {
      this.userMarker.setLatLng(coords);
    } else {
      const iconoUsuario = L.divIcon({
        className: 'user-location-wrapper',
        html: '<div class="user-location-dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      this.userMarker = L.marker(coords, { icon: iconoUsuario })
        .addTo(this.mapInstance)
        .bindPopup('<strong>Tu ubicación actual</strong><br/><small>Centro de búsqueda por radio</small>');
    }

    if (this.userRadiusCircle) {
      this.userRadiusCircle.setLatLng(coords);
      this.userRadiusCircle.setRadius(radioKm * 1000);
    } else {
      this.userRadiusCircle = L.circle(coords, {
        radius: radioKm * 1000,
        color: '#2D6A4F',
        weight: 1.5,
        fillColor: '#2D6A4F',
        fillOpacity: 0.08
      }).addTo(this.mapInstance);
    }

    if (centrar) {
      const zoom = radioKm <= 2 ? 15 : (radioKm <= 5 ? 14 : 12);
      this.mapInstance.setView(coords, zoom);
    }
  },

  renderizarMarcadores(lista = tiendasRegistradas) {
    this.ultimaListaFiltrada = lista;
    if (!this.mapInstance) return;
    Object.values(this.markersById).forEach(m => this.mapInstance.removeLayer(m));
    this.markersById = {};

    const radioMax = parseFloat(document.getElementById('radius-filter')?.value || '5');
    this.actualizarUbicacionUsuarioEnMapa(false);

    // Se muestran todos los negocios (dentro del radio y lejos de la zona) indicando su estado de distancia
    lista.forEach(tienda => {
      const dentroDelRadio = tienda.distanciaKm <= radioMax;
      const esRec = esTiendaRecomendada(tienda);
      const etiquetaRec = tienda.promocionado
        ? `<span style="background:#F4A261;color:#212529;padding:2px 6px;border-radius:99px;font-size:11px;font-weight:800;">Destacado</span>`
        : (esRec ? `<span style="background:#E8F5E9;color:#1B4332;padding:2px 6px;border-radius:99px;font-size:11px;font-weight:800;">Top Ventas</span>` : '');

      const etiquetaZona = dentroDelRadio
        ? `<span style="background:#E8F5E9;color:#1B4332;padding:2px 6px;border-radius:99px;font-size:11px;font-weight:700;">En tu radio (${tienda.distanciaKm} km)</span>`
        : `<span style="background:#FEFAE0;color:#BC6C25;border:1px solid #BC6C25;padding:2px 6px;border-radius:99px;font-size:11px;font-weight:700;">Lejos de tu zona (${tienda.distanciaKm} km)</span>`;

      const prodsDisponibles = obtenerProductosTienda(tienda).filter(p => Number(p.stock) > 0);
      const resumenStock = prodsDisponibles.slice(0, 2).map(p => `${p.nombre} (${p.stock} ${p.unidad})`).join(', ');

      const marker = L.marker(tienda.coords).addTo(this.mapInstance);
      marker.bindPopup(`
        <div style="min-width:215px;">
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;">
            ${etiquetaRec}
            ${etiquetaZona}
          </div>
          <strong style="display:block;font-size:14px;">${tienda.nombre}</strong>
          <small style="color:#495057;">${tienda.categoria} · ★ ${tienda.calificacion}</small>
          ${resumenStock ? `<div style="margin-top:4px;font-size:11px;color:#1B4332;"><strong>En stock:</strong> ${resumenStock}</div>` : ''}
          <button type="button" style="margin-top:8px;width:100%;padding:6px 10px;background:#2D6A4F;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:700;"
            onclick="abrirDetalleTiendaPorId('${tienda.id}')">
            Ver lista completa y pedir
          </button>
        </div>
      `);
      this.markersById[tienda.id] = marker;
    });
  },

  enfocarTienda(tiendaId) {
    const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
    if (!tienda || !this.mapInstance) return;
    this.mapInstance.flyTo(tienda.coords, 16, { duration: 0.7 });
    const marker = this.markersById[tiendaId];
    if (marker) {
      setTimeout(() => marker.openPopup(), 450);
    }
  },

  filtrarPorCategoria(categoria, subcategoria = 'todas') {
    categoriaMapaActiva = categoria;
    subcategoriaMapaActiva = subcategoria;

    if (categoria === 'todos') {
      ocultarEstadoBusquedaMapa();
      this.renderizarMarcadores(tiendasRegistradas);
      return;
    }

    const filtradas = tiendasRegistradas.filter(tienda => {
      const prodsConStock = obtenerProductosTienda(tienda).filter(p => Number(p.stock) > 0);
      if (subcategoria && subcategoria !== 'todas') {
        return prodsConStock.some(p => p.subcategoria === subcategoria);
      }
      return tienda.categoria === categoria || prodsConStock.some(p => p.categoria === categoria);
    });

    this.renderizarMarcadores(filtradas);

    const radioMax = parseFloat(document.getElementById('radius-filter')?.value || '15');
    const enRadio = filtradas.filter(t => t.distanciaKm <= radioMax);
    const etiqueta = subcategoria !== 'todas' ? `${categoria} › ${subcategoria}` : categoria;

    mostrarEstadoBusquedaMapa(
      enRadio.length > 0
        ? `Mostrando ${enRadio.length} tienda(s) dentro de ${radioMax} km (${filtradas.length} en total) en "${etiqueta}".`
        : `${filtradas.length} tienda(s) con existencias en "${etiqueta}" (fuera de tu radio de ${radioMax} km).`
    );

    if (filtradas.length > 0) {
      this.enfocarTienda((enRadio[0] || filtradas[0]).id);
    }
  }
};

function aplicarFiltroRadio() {
  const radioMax = parseFloat(document.getElementById('radius-filter')?.value || '5');
  MAP_HOOKS.actualizarUbicacionUsuarioEnMapa(true);

  if (categoriaMapaActiva !== 'todos') {
    MAP_HOOKS.filtrarPorCategoria(categoriaMapaActiva, subcategoriaMapaActiva);
  } else {
    MAP_HOOKS.renderizarMarcadores(MAP_HOOKS.ultimaListaFiltrada || tiendasRegistradas);
    const totalEnRadio = (MAP_HOOKS.ultimaListaFiltrada || tiendasRegistradas).filter(t => t.distanciaKm <= radioMax).length;
    mostrarEstadoBusquedaMapa(`Radio activo: ${radioMax} km (${totalEnRadio} negocio(s) cercano(s)).`);
  }
}

function mostrarEstadoBusquedaMapa(texto) {
  const box = document.getElementById('map-search-status');
  const label = document.getElementById('map-search-status-text');
  if (!box || !label) return;
  label.textContent = texto;
  box.classList.remove('hidden');
  lucide.createIcons();
}

function ocultarEstadoBusquedaMapa() {
  const box = document.getElementById('map-search-status');
  if (box) box.classList.add('hidden');
}

function limpiarFiltroBusquedaMapa() {
  const input = document.getElementById('map-search');
  if (input) input.value = '';
  categoriaMapaActiva = 'todos';
  subcategoriaMapaActiva = 'todas';
  document.querySelectorAll('#category-filters .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === 'todos');
  });
  document.getElementById('subcategory-bar')?.classList.add('hidden');
  ocultarEstadoBusquedaMapa();
  MAP_HOOKS.renderizarMarcadores(tiendasRegistradas);
}

/* =========================================================
   HISTORIAL DE BUSQUEDAS RECIENTES Y SUGERENCIAS INTELIGENTES
   ========================================================= */
function mostrarHistorialBusquedas() {
  const dropdown = document.getElementById('search-history-dropdown');
  if (!dropdown) return;
  renderizarHistorialBusquedas(document.getElementById('map-search')?.value || '');
  dropdown.classList.remove('hidden');
}

function ocultarHistorialBusquedas() {
  const dropdown = document.getElementById('search-history-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

function guardarEnHistorialBusqueda(termino, tipo = 'Búsqueda') {
  const limpio = termino.trim();
  if (!limpio) return;

  busquedasRecientes = busquedasRecientes.filter(
    item => item.texto.toLowerCase() !== limpio.toLowerCase()
  );
  busquedasRecientes.unshift({ texto: limpio, tipo });
  busquedasRecientes = busquedasRecientes.slice(0, 7);

  localStorage.setItem('nexolocal_busquedas_recientes', JSON.stringify(busquedasRecientes));
  DB_HOOKS.guardarBusquedaReciente(limpio, tipo);
}

function renderizarHistorialBusquedas(filtroTexto = '') {
  const listEl = document.getElementById('search-history-list');
  if (!listEl) return;

  const q = filtroTexto.trim();
  const recientesFiltrados = q
    ? busquedasRecientes.filter(b => coincidenciaAproximada(q, b.texto))
    : busquedasRecientes;

  let html = '';

  if (q.length >= 2) {
    const interpretacion = interpretarConsultaBusqueda(q);
    if (interpretacion.fueCorregido) {
      html += `
        <div class="history-item">
          <div class="history-item-main" onclick="aplicarBusquedaDesdeHistorial('${interpretacion.terminoInterpretado.replace(/'/g, "\\'")}', 'Sugerencia')">
            <i data-lucide="sparkles"></i>
            <span>Buscar <strong>${interpretacion.terminoInterpretado}</strong></span>
            <span class="history-type-tag smart">Interpretado</span>
          </div>
        </div>
      `;
    }

    const productosEncontrados = [];
    tiendasRegistradas.forEach(t => {
      obtenerProductosTienda(t)
        .filter(p => Number(p.stock) > 0)
        .forEach(p => {
          if (
            coincidenciaAproximada(q, p.nombre) ||
            coincidenciaAproximada(q, p.subcategoria) ||
            coincidenciaAproximada(interpretacion.terminoInterpretado, p.nombre) ||
            coincidenciaAproximada(interpretacion.terminoInterpretado, p.subcategoria)
          ) {
            productosEncontrados.push({ producto: p, tienda: t });
          }
        });
    });

    productosEncontrados.slice(0, 4).forEach(({ producto, tienda }) => {
      html += `
        <div class="history-item">
          <div class="history-item-main" onclick="seleccionarProductoEnTienda('${tienda.id}', '${producto.nombre.replace(/'/g, "\\'")}')">
            <i data-lucide="package-check"></i>
            <span><strong>${producto.nombre}</strong> (${producto.stock} ${producto.unidad}) · ${tienda.nombre} (${tienda.distanciaKm} km)</span>
            <span class="history-type-tag">${producto.subcategoria}</span>
          </div>
        </div>
      `;
    });

    const tiendasCoinciden = tiendasRegistradas.filter(t => coincidenciaAproximada(q, t.nombre));
    tiendasCoinciden.slice(0, 2).forEach(t => {
      html += `
        <div class="history-item">
          <div class="history-item-main" onclick="seleccionarTiendaDesdeBuscador('${t.id}')">
            <i data-lucide="map-pin"></i>
            <span><strong>${t.nombre}</strong> · ★ ${t.calificacion} · ${t.distanciaKm} km</span>
            <span class="history-type-tag">Tienda</span>
          </div>
        </div>
      `;
    });
  }

  if (recientesFiltrados.length > 0) {
    html += recientesFiltrados.map((item, idx) => `
      <div class="history-item">
        <div class="history-item-main" onclick="aplicarBusquedaDesdeHistorial('${item.texto.replace(/'/g, "\\'")}', '${item.tipo}')">
          <i data-lucide="${item.tipo === 'Tienda' ? 'store' : 'history'}"></i>
          <span>${item.texto}</span>
          <span class="history-type-tag">${item.tipo}</span>
        </div>
        <button type="button" class="btn-remove-history" onclick="eliminarItemHistorial(${idx})" title="Quitar">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join('');
  }

  if (!html) {
    html = `<p class="hint" style="padding:0.4rem;">Escribe el nombre de un producto, subcategoría o tienda (incluso con errores ortográficos).</p>`;
  }

  listEl.innerHTML = html;
  lucide.createIcons();
}

function filtrarSugerenciasBusqueda() {
  mostrarHistorialBusquedas();
}

function ejecutarBusquedaMapa(event) {
  event.preventDefault();
  const input = document.getElementById('map-search');
  const terminoOriginal = input.value.trim();
  if (!terminoOriginal) {
    limpiarFiltroBusquedaMapa();
    return;
  }

  const { terminoInterpretado, fueCorregido } = interpretarConsultaBusqueda(terminoOriginal);
  const tiendaExacta = tiendasRegistradas.find(t => coincidenciaAproximada(terminoOriginal, t.nombre));
  const tipoDetectado = tiendaExacta ? 'Tienda' : 'Producto';

  guardarEnHistorialBusqueda(terminoInterpretado, tipoDetectado);
  ocultarHistorialBusquedas();

  const filtradas = tiendasRegistradas.filter(t => {
    const coincideTienda = coincidenciaAproximada(terminoOriginal, t.nombre);
    const prodsEnStock = obtenerProductosTienda(t).filter(p => Number(p.stock) > 0);
    const coincideProducto = prodsEnStock.some(p =>
      coincidenciaAproximada(terminoOriginal, p.nombre) ||
      coincidenciaAproximada(terminoOriginal, p.subcategoria) ||
      coincidenciaAproximada(terminoInterpretado, p.nombre) ||
      coincidenciaAproximada(terminoInterpretado, p.subcategoria)
    );
    return coincideTienda || coincideProducto;
  });

  MAP_HOOKS.renderizarMarcadores(filtradas);

  const radioMax = parseFloat(document.getElementById('radius-filter')?.value || '15');
  const enRadio = filtradas.filter(t => t.distanciaKm <= radioMax);
  const avisoCorreccion = fueCorregido ? ` (interpretado de "${terminoOriginal}")` : '';

  if (enRadio.length > 0) {
    mostrarEstadoBusquedaMapa(
      `${enRadio.length} tienda(s) con existencias para "${terminoInterpretado}"${avisoCorreccion} dentro de ${radioMax} km.`
    );
    MAP_HOOKS.enfocarTienda(enRadio[0].id);
  } else {
    mostrarEstadoBusquedaMapa(
      filtradas.length > 0
        ? `${filtradas.length} tienda(s) con existencias para "${terminoInterpretado}"${avisoCorreccion} (fuera del radio de ${radioMax} km).`
        : `Sin existencias disponibles para "${terminoInterpretado}"${avisoCorreccion}.`
    );
  }
}

function aplicarBusquedaDesdeHistorial(texto) {
  const input = document.getElementById('map-search');
  if (input) input.value = texto;
  ejecutarBusquedaMapa({ preventDefault: () => {} });
}

function seleccionarProductoEnTienda(tiendaId, nombreProducto) {
  const input = document.getElementById('map-search');
  if (input) input.value = nombreProducto;
  guardarEnHistorialBusqueda(nombreProducto, 'Producto');
  ocultarHistorialBusquedas();

  const filtradas = tiendasRegistradas.filter(t =>
    obtenerProductosTienda(t).some(p => Number(p.stock) > 0 && coincidenciaAproximada(nombreProducto, p.nombre))
  );
  MAP_HOOKS.renderizarMarcadores(filtradas.length ? filtradas : tiendasRegistradas);
  mostrarEstadoBusquedaMapa(`Mostrando tiendas con stock disponible de "${nombreProducto}".`);
  MAP_HOOKS.enfocarTienda(tiendaId);
}

function seleccionarTiendaDesdeBuscador(tiendaId) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
  if (!tienda) return;
  document.getElementById('map-search').value = tienda.nombre;
  guardarEnHistorialBusqueda(tienda.nombre, 'Tienda');
  ocultarHistorialBusquedas();
  MAP_HOOKS.renderizarMarcadores([tienda]);
  mostrarEstadoBusquedaMapa(`Ubicando "${tienda.nombre}" (${tienda.distanciaKm} km).`);
  MAP_HOOKS.enfocarTienda(tienda.id);
}

function eliminarItemHistorial(index) {
  busquedasRecientes.splice(index, 1);
  localStorage.setItem('nexolocal_busquedas_recientes', JSON.stringify(busquedasRecientes));
  renderizarHistorialBusquedas(document.getElementById('map-search')?.value || '');
}

function limpiarHistorialBusquedas() {
  busquedasRecientes = [];
  localStorage.setItem('nexolocal_busquedas_recientes', JSON.stringify([]));
  renderizarHistorialBusquedas();
}

document.addEventListener('click', e => {
  const container = document.getElementById('search-container');
  if (container && !container.contains(e.target)) {
    ocultarHistorialBusquedas();
  }
});

/* =========================================================
   MENU DESPLEGABLE IZQUIERDO (3 RAYITAS = "TODAS" POR DEFECTO)
   ========================================================= */
function esTiendaRecomendada(tienda) {
  return Boolean(tienda.promocionado) || Number(tienda.ventasTotales || 0) >= UMBRAL_VENTAS_RECOMENDADO;
}

function abrirDrawerTiendas(filtroInicial = 'todos') {
  filtroTiendaActivo = filtroInicial;
  document.querySelectorAll('#drawer-filters .drawer-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filtroInicial);
  });
  renderizarDirectorioTiendas();
  document.getElementById('drawer-backdrop').classList.remove('hidden');
  document.getElementById('stores-drawer').classList.add('open');
  document.getElementById('stores-drawer').setAttribute('aria-hidden', 'false');
}

function cerrarDrawerTiendas() {
  document.getElementById('drawer-backdrop').classList.add('hidden');
  document.getElementById('stores-drawer').classList.remove('open');
  document.getElementById('stores-drawer').setAttribute('aria-hidden', 'true');
}

function seleccionarFiltroTienda(filtro, boton) {
  filtroTiendaActivo = filtro;
  document.querySelectorAll('#drawer-filters .drawer-chip').forEach(b => b.classList.remove('active'));
  if (boton) boton.classList.add('active');
  renderizarDirectorioTiendas();
}

function renderizarDirectorioTiendas() {
  const listEl = document.getElementById('drawer-stores-list');
  const countLabel = document.getElementById('drawer-count-label');
  if (!listEl) return;

  const query = (document.getElementById('drawer-store-search')?.value || '').trim();
  let lista = [...tiendasRegistradas];

  if (query) {
    const { terminoInterpretado } = interpretarConsultaBusqueda(query);
    lista = lista.filter(t => {
      const prodsEnStock = obtenerProductosTienda(t).filter(p => Number(p.stock) > 0);
      return (
        coincidenciaAproximada(query, t.nombre) ||
        coincidenciaAproximada(query, t.categoria) ||
        prodsEnStock.some(p =>
          coincidenciaAproximada(query, p.nombre) ||
          coincidenciaAproximada(query, p.subcategoria) ||
          coincidenciaAproximada(terminoInterpretado, p.nombre) ||
          coincidenciaAproximada(terminoInterpretado, p.subcategoria)
        )
      );
    });
  }

  const etiquetasFiltro = {
    todos: 'Todas las tiendas registradas',
    recomendados: 'Negocios recomendados (Top Ventas y Patrocinados)',
    calificacion: 'Ordenadas por mejor calificación',
    cerca: 'Ordenadas por menor distancia a tu ubicación',
    abierto: 'Tiendas abiertas en este momento'
  };

  if (filtroTiendaActivo === 'recomendados') {
    lista = lista.filter(esTiendaRecomendada);
    lista.sort((a, b) => (b.promocionado - a.promocionado) || (b.ventasTotales - a.ventasTotales));
  } else if (filtroTiendaActivo === 'calificacion') {
    lista.sort((a, b) => b.calificacion - a.calificacion);
  } else if (filtroTiendaActivo === 'cerca') {
    lista.sort((a, b) => a.distanciaKm - b.distanciaKm);
  } else if (filtroTiendaActivo === 'abierto') {
    lista = lista.filter(t => t.abierto);
  }

  if (countLabel) {
    countLabel.textContent = `${etiquetasFiltro[filtroTiendaActivo] || 'Tiendas'} (${lista.length})`;
  }

  if (lista.length === 0) {
    listEl.innerHTML = `<div class="empty-box"><p>No hay establecimientos con existencias que coincidan con este filtro.</p></div>`;
    return;
  }

  listEl.innerHTML = lista.map(t => {
    const esRec = esTiendaRecomendada(t);
    let badgeHtml = '';
    if (t.promocionado) {
      badgeHtml = `<span class="rec-badge sponsored"><i data-lucide="megaphone"></i> Destacado</span>`;
    } else if (t.ventasTotales >= UMBRAL_VENTAS_RECOMENDADO) {
      badgeHtml = `<span class="rec-badge organic"><i data-lucide="award"></i> Top Ventas</span>`;
    }

    const prodsConStock = obtenerProductosTienda(t).filter(p => Number(p.stock) > 0);
    const resumenProds = prodsConStock.length
      ? prodsConStock.map(p => p.nombre).slice(0, 3).join(', ')
      : 'Sin artículos en stock por el momento';

    return `
      <article class="drawer-store-card ${esRec ? 'is-recommended' : ''}">
        <div class="store-card-top">
          <h4>${t.nombre}</h4>
          ${badgeHtml}
        </div>
        <div class="store-card-meta">
          <span><i data-lucide="star"></i> ${t.calificacion} (${t.resenasCount})</span>
          <span><i data-lucide="navigation"></i> ${t.distanciaKm} km</span>
          <span class="${t.abierto ? 'status-open' : 'status-closed'}">
            <i data-lucide="clock"></i> ${t.abierto ? 'Abierto' : 'Cerrado'} · ${t.horario}
          </span>
          <span><i data-lucide="shopping-bag"></i> ${t.ventasTotales} pedidos</span>
        </div>
        <p class="store-card-products"><strong>En existencia:</strong> ${resumenProds}</p>
        <div class="store-card-actions">
          <button type="button" class="btn-card-mini" onclick="ubicarTiendaDesdeDrawer('${t.id}')">
            <i data-lucide="map-pin"></i> Ver en mapa
          </button>
          <button type="button" class="btn-card-mini primary" onclick="abrirTiendaDesdeDrawer('${t.id}')">
            <i data-lucide="star"></i> Catálogo y calificar
          </button>
        </div>
      </article>
    `;
  }).join('');

  lucide.createIcons();
}

function ubicarTiendaDesdeDrawer(tiendaId) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
  if (tienda) {
    guardarEnHistorialBusqueda(tienda.nombre, 'Tienda');
  }
  cerrarDrawerTiendas();
  MAP_HOOKS.renderizarMarcadores(tiendasRegistradas);
  MAP_HOOKS.enfocarTienda(tiendaId);
}

function abrirTiendaDesdeDrawer(tiendaId) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
  if (tienda) {
    guardarEnHistorialBusqueda(tienda.nombre, 'Tienda');
  }
  cerrarDrawerTiendas();
  abrirDetalleTiendaPorId(tiendaId);
}

/* =========================================================
   PROMOCION DE NEGOCIO Y RECOMENDACION ORGANICA (VENDEDOR)
   ========================================================= */
function obtenerTiendaDelVendedor() {
  return tiendasRegistradas[0];
}

function actualizarEstadoPromocionVendedor() {
  const tienda = obtenerTiendaDelVendedor();
  if (!tienda) return;

  const badgeHero = document.getElementById('seller-promo-badge');
  const badgeText = document.getElementById('seller-promo-text');
  const esRec = esTiendaRecomendada(tienda);

  if (badgeHero && badgeText) {
    if (esRec) {
      badgeHero.classList.remove('hidden');
      badgeText.textContent = tienda.promocionado
        ? `Recomendado · ${tienda.planPromo}`
        : `Recomendado · Top Ventas (${tienda.ventasTotales})`;
    } else {
      badgeHero.classList.add('hidden');
    }
  }

  const organicStatus = document.getElementById('organic-status-pill');
  const organicBar = document.getElementById('organic-progress-bar');
  const organicLabel = document.getElementById('organic-sales-label');

  if (organicStatus && organicBar && organicLabel) {
    const pct = Math.min(100, Math.round((tienda.ventasTotales / UMBRAL_VENTAS_RECOMENDADO) * 100));
    organicBar.style.width = `${pct}%`;
    organicLabel.textContent = `${tienda.ventasTotales} de ${UMBRAL_VENTAS_RECOMENDADO} ventas completadas`;
    organicStatus.textContent = tienda.ventasTotales >= UMBRAL_VENTAS_RECOMENDADO
      ? 'Calificado en Recomendados'
      : `Faltan ${UMBRAL_VENTAS_RECOMENDADO - tienda.ventasTotales} ventas`;
  }
}

function abrirModalPromocion() {
  actualizarEstadoPromocionVendedor();
  const msg = document.getElementById('promo-feedback-msg');
  if (msg) msg.classList.add('hidden');
  document.getElementById('modal-promocion').classList.remove('hidden');
  lucide.createIcons();
}

function simularVentasDemo() {
  const tienda = obtenerTiendaDelVendedor();
  if (!tienda) return;
  tienda.ventasTotales += 5;
  actualizarEstadoPromocionVendedor();
  MAP_HOOKS.renderizarMarcadores();
}

async function activarPromocionNegocio(nombrePlan) {
  const tienda = obtenerTiendaDelVendedor();
  if (!tienda) return;

  tienda.promocionado = true;
  tienda.planPromo = nombrePlan;

  await DB_HOOKS.activarPromocion(tienda.id, nombrePlan);
  actualizarEstadoPromocionVendedor();
  MAP_HOOKS.renderizarMarcadores();

  const msg = document.getElementById('promo-feedback-msg');
  if (msg) {
    msg.textContent = `Plan "${nombrePlan}" activado. Tu negocio ya aparece destacado en la sección Recomendados de los compradores.`;
    msg.classList.remove('hidden');
    msg.classList.add('ok');
  }
  lucide.createIcons();
}

/* =========================================================
   VALIDACIONES Y VISIBILIDAD DE CONTRASENA (OJITO)
   ========================================================= */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const mostrar = input.type === 'password';
  input.type = mostrar ? 'text' : 'password';
  const icono = btn.querySelector('svg, i');
  if (icono) {
    icono.setAttribute('data-lucide', mostrar ? 'eye-off' : 'eye');
    lucide.createIcons();
  }
}

function esUnidadContinua(unidad) {
  return UNIDADES_CONTINUAS.has((unidad || 'pz').toLowerCase());
}

function soloNumeros(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
}

function soloDecimales(input) {
  input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function validarInputSegunUnidad(input, unidadForzada = null) {
  const unidad = unidadForzada || document.getElementById('prod-unidad')?.value || 'pz';
  if (esUnidadContinua(unidad)) {
    soloDecimales(input);
  } else {
    soloNumeros(input);
  }
}

function normalizarCantidadInput(input, unidad = 'pz') {
  if (esUnidadContinua(unidad)) {
    const limpio = input.value.replace(/[^0-9.]/g, '');
    const numero = parseFloat(limpio);
    input.value = (!numero || numero <= 0) ? '1' : String(Math.round(numero * 100) / 100);
  } else {
    const limpio = input.value.replace(/[^0-9]/g, '');
    const numero = parseInt(limpio, 10);
    input.value = (!numero || numero <= 0) ? '1' : String(numero);
  }
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
    nombre: rol === 'comprador' ? 'Comprador Invitado' : 'Productores y Abarrotes del Centro',
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
  const btnCarritoNav = document.getElementById('btn-carrito-nav');

  if (usuarioActual.rol === 'vendedor') {
    vistaComprador.classList.add('hidden');
    vistaVendedor.classList.remove('hidden');
    if (btnCarritoNav) btnCarritoNav.classList.add('hidden');
    badge.textContent = 'Negocio / Productor';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Comprador';
    document.getElementById('seller-business-name').textContent = usuarioActual.nombre;
    if (tiendasRegistradas[0]) {
      tiendasRegistradas[0].nombre = usuarioActual.nombre;
    }
    actualizarBadgeVerificacion(Boolean(usuarioActual.verificado));
    actualizarEstadoPromocionVendedor();
    renderizarSeccionTemporadaAlta();
    renderizarInventario();
    actualizarListaReabastecimiento();
    renderizarPedidosVendedor();
  } else {
    vistaVendedor.classList.add('hidden');
    vistaComprador.classList.remove('hidden');
    if (btnCarritoNav) btnCarritoNav.classList.remove('hidden');
    badge.textContent = 'Comprador';
    btnSwitch.querySelector('span').textContent = 'Cambiar a Negocio';
    actualizarBadgesCarrito();
    setTimeout(() => {
      MAP_HOOKS.inicializar();
      MAP_HOOKS.renderizarMarcadores(tiendasRegistradas);
      solicitarUbicacionUsuario(false);
    }, 60);
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
   CATEGORIAS, SUBCATEGORIAS, UNIDADES E INVENTARIO
   ========================================================= */
function poblarSelectCategorias(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = Object.keys(CATEGORIAS_CATALOGO)
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join('');
}

function actualizarSubcategoriasModal(categoriaSeleccionada) {
  const selectSub = document.getElementById('prod-subcategoria');
  if (!selectSub) return;
  const opciones = CATEGORIAS_CATALOGO[categoriaSeleccionada] || ['General'];
  selectSub.innerHTML = opciones
    .map(sub => `<option value="${sub}">${sub}</option>`)
    .join('');
  actualizarUnidadesModal();
}

function actualizarUnidadesModal() {
  const sub = document.getElementById('prod-subcategoria')?.value;
  const selectUnidad = document.getElementById('prod-unidad');
  if (!selectUnidad) return;

  const sugeridas = UNIDADES_POR_SUBCATEGORIA[sub] || ['pz', 'kg', 'lt', 'paquete', 'caja'];
  const restantes = TODAS_LAS_UNIDADES.filter(u => !sugeridas.includes(u));

  selectUnidad.innerHTML =
    `<optgroup label="Recomendadas para ${sub}">` +
    sugeridas.map(u => `<option value="${u}">${u}</option>`).join('') +
    `</optgroup>` +
    `<optgroup label="Otras unidades">` +
    restantes.map(u => `<option value="${u}">${u}</option>`).join('') +
    `</optgroup>`;

  ajustarPlaceholderStock();
}

function ajustarPlaceholderStock() {
  const unidad = document.getElementById('prod-unidad')?.value || 'pz';
  const inputStock = document.getElementById('prod-stock');
  if (!inputStock) return;
  inputStock.value = '';
  inputStock.placeholder = esUnidadContinua(unidad) ? 'Ej. 25.5' : 'Ej. 50';
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
  if (!tbody) return;
  tbody.innerHTML = '';

  let criticos = 0;

  inventarioLocal.forEach(item => {
    const usaMetaTemporada = modoTemporadaAltaActivo && !productosExcluidosTemporada.includes(item.id);
    const metaMinima = obtenerMetaMinimaEfectiva(item);
    const esCritico = item.stock < metaMinima;
    if (esCritico) criticos++;
    const unidad = item.unidad || 'pz';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>
        <div class="cat-cell">
          <span class="cat-main">${item.categoria}</span>
          <span class="subcat-tag">${item.subcategoria || 'General'}</span>
        </div>
      </td>
      <td>$${Number(item.precio).toFixed(2)} <small>/ ${unidad}</small></td>
      <td>
        <strong id="stock-${item.id}">${item.stock}</strong>
        <span class="unit-pill">${unidad}</span>
        <small class="hint" style="display:block;">Meta ${usaMetaTemporada ? 'Temp. Alta' : 'mínima'}: ${metaMinima} ${unidad}</small>
      </td>
      <td>
        <span class="${esCritico ? 'badge-danger' : 'badge-ok'}">
          ${esCritico ? (usaMetaTemporada ? 'Bajo meta temporada' : 'Stock crítico') : 'En existencia'}
        </span>
      </td>
      <td>
        <div class="kardex-controls">
          <button type="button" class="btn-kardex minus" onclick="aplicarMovimientoStock('${item.id}', 'SALIDA')" title="Registrar salida en ${unidad}">
            <i data-lucide="minus"></i> Salida
          </button>
          <input
            type="text"
            inputmode="decimal"
            id="qty-${item.id}"
            class="qty-input"
            value="1"
            aria-label="Cantidad en ${unidad}"
            oninput="validarInputSegunUnidad(this, '${unidad}')"
            onblur="normalizarCantidadInput(this, '${unidad}')"
          />
          <button type="button" class="btn-kardex plus" onclick="aplicarMovimientoStock('${item.id}', 'ENTRADA')" title="Registrar entrada en ${unidad}">
            <i data-lucide="plus"></i> Entrada
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('kpi-total-productos').textContent = inventarioLocal.length;
  document.getElementById('kpi-stock-bajo').textContent = criticos;
  const labelBajo = document.getElementById('kpi-stock-bajo-label');
  if (labelBajo) {
    labelBajo.textContent = modoTemporadaAltaActivo
      ? 'Bajo meta de Temporada Alta'
      : 'Stock Crítico (por debajo de meta)';
  }
  document.getElementById('kpi-entradas').textContent = `${entradasTurno} reg.`;
  document.getElementById('kpi-salidas').textContent = `${salidasTurno} reg.`;
  lucide.createIcons();
}

function aplicarMovimientoStock(productoId, tipo) {
  const producto = inventarioLocal.find(p => p.id === productoId);
  if (!producto) return;
  const unidad = producto.unidad || 'pz';

  const inputQty = document.getElementById(`qty-${productoId}`);
  normalizarCantidadInput(inputQty, unidad);
  const cantidad = esUnidadContinua(unidad) ? parseFloat(inputQty.value) : parseInt(inputQty.value, 10);

  if (tipo === 'ENTRADA') {
    producto.stock = Math.round((producto.stock + cantidad) * 100) / 100;
    entradasTurno += 1;
  } else {
    producto.stock = Math.max(0, Math.round((producto.stock - cantidad) * 100) / 100);
    salidasTurno += 1;

    const ultimoPeriodo = historialVentasMensual[historialVentasMensual.length - 1];
    if (ultimoPeriodo) {
      ultimoPeriodo.ventasPorProducto[productoId] = (ultimoPeriodo.ventasPorProducto[productoId] || 0) + cantidad;
    }
  }

  renderizarInventario();
  renderizarSeccionTemporadaAlta();
  actualizarListaReabastecimiento();
  actualizarBadgesCarrito();
  DB_HOOKS.registrarMovimientoInventario(productoId, tipo, cantidad, unidad);
}

function guardarProductoManual(event) {
  event.preventDefault();
  const nombre = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value;
  const subcategoria = document.getElementById('prod-subcategoria').value;
  const unidad = document.getElementById('prod-unidad').value;
  const precio = parseFloat(document.getElementById('prod-precio').value) || 0;
  const stockRaw = document.getElementById('prod-stock').value;
  const stock = esUnidadContinua(unidad)
    ? Math.round((parseFloat(stockRaw) || 0) * 100) / 100
    : (parseInt(stockRaw, 10) || 0);

  const nuevo = {
    id: `prod-${Date.now()}`,
    nombre,
    categoria,
    subcategoria,
    unidad,
    precio,
    stock,
    minimo: 5
  };

  inventarioLocal.push(nuevo);
  renderizarInventario();
  renderizarSeccionTemporadaAlta();
  actualizarListaReabastecimiento();
  DB_HOOKS.crearProducto(nuevo);
  cerrarModal('modal-nuevo-producto');
  event.target.reset();
  actualizarSubcategoriasModal(document.getElementById('prod-categoria').value);
}

/* =========================================================
   PETICIONES DE NUEVA CATEGORIA / SUBCATEGORIA AL ADMIN
   ========================================================= */
function abrirModalSolicitarCategoria() {
  poblarSelectCategorias('pet-categoria-padre');
  renderizarPeticionesCategorias();
  document.getElementById('modal-solicitar-categoria').classList.remove('hidden');
}

function toggleCategoriaPadrePeticion(tipo) {
  const grupoPadre = document.getElementById('grupo-pet-padre');
  if (grupoPadre) {
    grupoPadre.classList.toggle('hidden', tipo === 'categoria');
  }
}

async function enviarPeticionCategoria(event) {
  event.preventDefault();
  const tipo = document.getElementById('pet-tipo').value;
  const padre = tipo === 'subcategoria' ? document.getElementById('pet-categoria-padre').value : 'Nueva categoría raíz';
  const nombre = document.getElementById('pet-nombre').value.trim();
  const unidades = document.getElementById('pet-unidades').value.trim();
  const ejemplo = document.getElementById('pet-ejemplo').value.trim();

  const nuevaPeticion = {
    id: `pet-${Date.now()}`,
    negocio: usuarioActual?.nombre || 'Negocio Local',
    tipo,
    padre,
    nombre,
    unidades,
    ejemplo,
    estado: 'Pendiente de revisión'
  };

  peticionesCategorias.unshift(nuevaPeticion);
  localStorage.setItem('nexolocal_peticiones_cat', JSON.stringify(peticionesCategorias));
  await DB_HOOKS.solicitarCategoria(nuevaPeticion);
  renderizarPeticionesCategorias();
  event.target.reset();
  toggleCategoriaPadrePeticion('subcategoria');
}

function renderizarPeticionesCategorias() {
  const lista = document.getElementById('lista-peticiones-categorias');
  if (!lista) return;
  if (peticionesCategorias.length === 0) {
    lista.innerHTML = `<p class="hint">Aún no has enviado solicitudes de categorías nuevas.</p>`;
    return;
  }

  lista.innerHTML = peticionesCategorias.map(p => `
    <div class="request-item">
      <div>
        <strong>${p.nombre}</strong> <small>(${p.tipo === 'categoria' ? 'Categoría' : `Subcategoría en ${p.padre}`})</small><br/>
        <small>Unidades: ${p.unidades} · Ej. ${p.ejemplo}</small>
      </div>
      <span class="request-status">${p.estado}</span>
    </div>
  `).join('');
}

/* =========================================================
   FICHA DE NEGOCIO Y CALIFICACION CON ESTRELLAS
   ========================================================= */
function seleccionarEstrella(valor) {
  estrellaSeleccionada = valor;
  const textos = {
    1: '1 de 5 — Mala experiencia',
    2: '2 de 5 — Regular',
    3: '3 de 5 — Aceptable',
    4: '4 de 5 — Muy bueno',
    5: '5 de 5 — Excelente'
  };
  document.getElementById('star-label-text').textContent = textos[valor];

  document.querySelectorAll('#star-picker .star-btn').forEach(btn => {
    const valBtn = parseInt(btn.dataset.val, 10);
    btn.classList.toggle('active', valBtn <= valor);
  });
}

function abrirDetalleTiendaPorId(tiendaId) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId) || tiendasRegistradas[0];
  abrirDetalleTienda(tienda);
}

function renderizarFichaTienda(tienda = null) {
  const activa = tienda || tiendaSeleccionadaModal || tiendasRegistradas[0];
  tiendaSeleccionadaModal = activa;

  document.getElementById('modal-tienda-nombre').textContent = activa.nombre;
  document.getElementById('modal-tienda-historia').textContent = activa.descripcion;

  const radioMax = parseFloat(document.getElementById('radius-filter')?.value || '5');
  const enZona = activa.distanciaKm <= radioMax;
  const zonaBadge = document.getElementById('modal-tienda-zona-badge');
  if (zonaBadge) {
    zonaBadge.classList.remove('hidden', 'in-zone', 'out-zone');
    zonaBadge.classList.add(enZona ? 'in-zone' : 'out-zone');
    zonaBadge.innerHTML = enZona
      ? `<i data-lucide="navigation"></i> Dentro de tu radio (${activa.distanciaKm} km)`
      : `<i data-lucide="map-pin"></i> Lejos de tu zona (${activa.distanciaKm} km · fuera de ${radioMax} km)`;
  }

  const fbStore = document.getElementById('store-cart-feedback');
  if (fbStore) fbStore.classList.add('hidden');
  actualizarBadgesCarrito();

  const promoTag = document.getElementById('modal-tienda-promo-tag');
  if (promoTag) {
    if (activa.promocionado) {
      promoTag.textContent = `Destacado · ${activa.planPromo || 'Patrocinado'}`;
      promoTag.classList.remove('hidden');
    } else if (activa.ventasTotales >= UMBRAL_VENTAS_RECOMENDADO) {
      promoTag.textContent = `Recomendado · ${activa.ventasTotales} ventas`;
      promoTag.classList.remove('hidden');
    } else {
      promoTag.classList.add('hidden');
    }
  }

  const productosMostrar = obtenerProductosTienda(activa);
  const gridProd = document.getElementById('modal-tienda-productos');
  if (gridProd) {
    gridProd.innerHTML = productosMostrar.map((p, idx) => {
      const prodKey = p.id || `${activa.id}-prod-${idx}`;
      const stockNum = Number(p.stock) || 0;
      const disponible = stockNum > 0;
      return `
        <div class="store-prod-card">
          <strong>${p.nombre}</strong>
          <span>${p.categoria} · ${p.subcategoria}</span>
          <span class="store-prod-price">$${Number(p.precio).toFixed(2)} / ${p.unidad} · ${disponible ? `Stock: ${stockNum} ${p.unidad}` : 'Agotado'}</span>
          <div class="store-prod-actions">
            <input
              type="text"
              inputmode="decimal"
              id="store-qty-${prodKey}"
              class="store-prod-qty"
              value="1"
              ${disponible ? '' : 'disabled'}
              aria-label="Cantidad de ${p.nombre}"
              oninput="validarInputSegunUnidad(this, '${p.unidad}')"
              onblur="normalizarCantidadInput(this, '${p.unidad}')"
            />
            <button
              type="button"
              class="btn-add-cart"
              ${disponible ? '' : 'disabled'}
              onclick="agregarAlCarrito('${activa.id}', '${prodKey}', ${idx})"
            >
              <i data-lucide="shopping-cart"></i>
              <span>${disponible ? 'Agregar' : 'Sin stock'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const totalEstrellas = resenasTienda.reduce((acc, r) => acc + r.estrellas, 0);
  const promedio = resenasTienda.length ? (totalEstrellas / resenasTienda.length).toFixed(1) : String(activa.calificacion);

  const ratingHeader = document.getElementById('modal-tienda-rating');
  if (ratingHeader) {
    ratingHeader.innerHTML = `<i data-lucide="star"></i> <strong>${promedio}</strong> (${resenasTienda.length} reseñas)`;
  }
  const heroRating = document.getElementById('hero-rating-val');
  if (heroRating) heroRating.textContent = promedio;

  const listaResenas = document.getElementById('lista-resenas-tienda');
  if (listaResenas) {
    listaResenas.innerHTML = resenasTienda.map(r => `
      <div class="review-item">
        <div class="review-top">
          <strong>${r.autor}</strong>
          <span class="review-stars">${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}</span>
        </div>
        <p>${r.comentario}</p>
      </div>
    `).join('');
  }
  lucide.createIcons();
}

async function enviarCalificacionTienda(event) {
  event.preventDefault();
  const inputComentario = document.getElementById('rating-comentario');
  const comentario = inputComentario.value.trim();
  if (!comentario) return;

  const nuevaResena = {
    tiendaId: tiendaSeleccionadaModal?.id || 'tienda-1',
    autor: usuarioActual?.nombre || 'Comprador Local',
    estrellas: estrellaSeleccionada,
    comentario
  };

  resenasTienda.unshift(nuevaResena);
  await DB_HOOKS.guardarCalificacion(nuevaResena);
  inputComentario.value = '';
  seleccionarEstrella(5);
  renderizarFichaTienda(tiendaSeleccionadaModal);
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

  guardarEnHistorialBusqueda(texto, 'Consulta IA');
  agregarBurbuja('chat-messages-comprador', texto, 'user');
  input.value = '';

  const catalogoDisponible = tiendasRegistradas.flatMap(t =>
    obtenerProductosTienda(t)
      .filter(p => Number(p.stock) > 0)
      .map(p => ({ ...p, tienda: t.nombre, distanciaKm: t.distanciaKm }))
  );

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'COMPRADOR',
        mensaje: texto,
        contextoProductos: catalogoDisponible
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
        unidad: resIA.datos.unidad || 'pz',
        precio: Number(resIA.datos.precio) || 0,
        stock: parseFloat(resIA.datos.cantidad) || 1,
        minimo: 5
      };
      inventarioLocal.push(nuevo);
      renderizarInventario();
      renderizarSeccionTemporadaAlta();
      actualizarListaReabastecimiento();
      DB_HOOKS.crearProducto(nuevo);
    } else if (resIA.accion === 'MOVIMIENTO' && resIA.datos) {
      const target = inventarioLocal.find(
        p => p.id === resIA.datos.producto_id || p.nombre.toLowerCase().includes((resIA.datos.nombre || '').toLowerCase())
      );
      if (target) {
        const cant = parseFloat(resIA.datos.cantidad) || 1;
        if (resIA.datos.tipo_movimiento === 'ENTRADA') {
          target.stock = Math.round((target.stock + cant) * 100) / 100;
          entradasTurno += 1;
        } else {
          target.stock = Math.max(0, Math.round((target.stock - cant) * 100) / 100);
          salidasTurno += 1;
        }
        renderizarInventario();
        renderizarSeccionTemporadaAlta();
        actualizarListaReabastecimiento();
        actualizarBadgesCarrito();
        DB_HOOKS.registrarMovimientoInventario(target.id, resIA.datos.tipo_movimiento, cant, target.unidad);
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

  if (tabId === 'temporada-alta') {
    renderizarSeccionTemporadaAlta();
  } else if (tabId === 'pedidos') {
    renderizarPedidosVendedor();
    actualizarListaReabastecimiento();
  }
}

function abrirDetalleTienda(datosNegocio) {
  const tienda = datosNegocio?.id
    ? tiendasRegistradas.find(t => t.id === datosNegocio.id)
    : (datosNegocio?.nombre
      ? tiendasRegistradas.find(t => t.nombre === datosNegocio.nombre) || tiendasRegistradas[0]
      : tiendasRegistradas[0]);

  renderizarFichaTienda(tienda);
  document.getElementById('modal-tienda').classList.remove('hidden');
}

function abrirModalNuevoProducto() {
  poblarSelectCategorias('prod-categoria');
  actualizarSubcategoriasModal(document.getElementById('prod-categoria').value);
  document.getElementById('modal-nuevo-producto').classList.remove('hidden');
}

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

/* ==========================================================================
   IMPLEMENTACION NUEVA: CARRITO TIPO MERCADO LIBRE, PAGO Y FLUJO DE DESPACHO
   ========================================================================== */
function guardarCarritoLocal() {
  localStorage.setItem('nexolocal_carrito', JSON.stringify(carritoCompras));
  actualizarBadgesCarrito();
}

function guardarPedidosClientesLocal() {
  localStorage.setItem('nexolocal_pedidos_clientes', JSON.stringify(pedidosClientes));
  actualizarBadgesCarrito();
  renderizarPedidosVendedor();
  renderizarPedidosComprador();
}

function obtenerProductoActualizado(tiendaId, productoId, nombreFallback) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
  if (!tienda) return null;
  const lista = obtenerProductosTienda(tienda);
  return (
    lista.find((p, idx) => (p.id || `${tienda.id}-prod-${idx}`) === productoId) ||
    lista.find(p => p.nombre === nombreFallback) ||
    null
  );
}

function actualizarBadgesCarrito() {
  const totalItems = carritoCompras.length;
  const activosComprador = pedidosClientes.filter(p => p.estado !== 'entregado').length;
  const activosVendedor = pedidosClientes.filter(p => p.estado !== 'entregado').length;

  const badgeNav = document.getElementById('cart-count-badge');
  if (badgeNav) badgeNav.textContent = totalItems;

  const badgeModalTienda = document.getElementById('modal-tienda-cart-count');
  if (badgeModalTienda) badgeModalTienda.textContent = totalItems;

  const badgeTabCart = document.getElementById('tab-cart-count');
  if (badgeTabCart) badgeTabCart.textContent = totalItems;

  const badgeTabOrders = document.getElementById('tab-orders-count');
  if (badgeTabOrders) badgeTabOrders.textContent = pedidosClientes.length;

  const liveOrdersBadge = document.getElementById('active-orders-indicator');
  if (liveOrdersBadge) {
    liveOrdersBadge.textContent = `${activosComprador} activo(s)`;
    liveOrdersBadge.classList.toggle('hidden', activosComprador === 0);
  }

  const badgeVendedor = document.getElementById('badge-pedidos-count');
  if (badgeVendedor) badgeVendedor.textContent = activosVendedor;
}

function agregarAlCarrito(tiendaId, prodKey, idxFallback) {
  const tienda = tiendasRegistradas.find(t => t.id === tiendaId);
  if (!tienda) return;

  const productos = obtenerProductosTienda(tienda);
  const producto = productos.find((p, i) => (p.id || `${tienda.id}-prod-${i}`) === prodKey) || productos[idxFallback];
  if (!producto) return;

  const inputQty = document.getElementById(`store-qty-${prodKey}`);
  if (inputQty) normalizarCantidadInput(inputQty, producto.unidad);
  const cantidadSolicitada = inputQty
    ? (esUnidadContinua(producto.unidad) ? parseFloat(inputQty.value) : parseInt(inputQty.value, 10))
    : 1;

  const stockActual = Number(producto.stock) || 0;
  const existente = carritoCompras.find(c => c.tiendaId === tiendaId && c.prodKey === prodKey);
  const cantidadAcumulada = (existente ? existente.cantidad : 0) + cantidadSolicitada;

  const fbStore = document.getElementById('store-cart-feedback');
  if (stockActual <= 0) {
    if (fbStore) {
      fbStore.textContent = `"${producto.nombre}" ya no tiene existencias disponibles en ${tienda.nombre}.`;
      fbStore.classList.remove('hidden', 'ok');
    }
    return;
  }

  if (cantidadAcumulada > stockActual) {
    if (fbStore) {
      fbStore.textContent = `Cantidad no disponible: solo quedan ${stockActual} ${producto.unidad} de "${producto.nombre}" en inventario.`;
      fbStore.classList.remove('hidden', 'ok');
    }
    return;
  }

  if (existente) {
    existente.cantidad = Math.round(cantidadAcumulada * 100) / 100;
    existente.precio = Number(producto.precio);
  } else {
    carritoCompras.push({
      tiendaId: tienda.id,
      tiendaNombre: tienda.nombre,
      prodKey,
      nombre: producto.nombre,
      unidad: producto.unidad || 'pz',
      precio: Number(producto.precio),
      cantidad: Math.round(cantidadSolicitada * 100) / 100
    });
  }

  guardarCarritoLocal();

  if (fbStore) {
    fbStore.textContent = `Agregado al carrito: ${cantidadSolicitada} ${producto.unidad} de "${producto.nombre}". Se guarda en tu carrito sin enviarse al vendedor hasta que pagues.`;
    fbStore.classList.remove('hidden');
    fbStore.classList.add('ok');
  }
}

function abrirModalCarrito(tabInicial = 'carrito') {
  cambiarTabModalCarrito(tabInicial);
  renderizarCarrito();
  renderizarPedidosComprador();
  document.getElementById('modal-carrito').classList.remove('hidden');
  lucide.createIcons();
}

function cambiarTabModalCarrito(tab) {
  const esCarrito = tab === 'carrito';
  document.getElementById('panel-carrito-compra')?.classList.toggle('hidden', !esCarrito);
  document.getElementById('panel-mis-pedidos')?.classList.toggle('hidden', esCarrito);
  document.getElementById('tab-btn-carrito')?.classList.toggle('active', esCarrito);
  document.getElementById('tab-btn-mis-pedidos')?.classList.toggle('active', !esCarrito);

  if (esCarrito) {
    renderizarCarrito();
  } else {
    renderizarPedidosComprador();
  }
  lucide.createIcons();
}

function renderizarCarrito() {
  const contenedor = document.getElementById('lista-items-carrito');
  const checkoutBox = document.getElementById('cart-checkout-section');
  const alertBox = document.getElementById('cart-stock-alert');
  const totalEl = document.getElementById('cart-total-price');
  const btnConfirmar = document.getElementById('btn-confirmar-carrito');
  if (!contenedor) return;

  if (carritoCompras.length === 0) {
    if (checkoutBox) checkoutBox.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');
    contenedor.innerHTML = `
      <div class="empty-box">
        <i data-lucide="shopping-cart"></i>
        <p>Tu carrito está vacío. Explora las tiendas en el mapa y agrega productos para ver existencias o programar tu Pick-Up.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  let totalGeneral = 0;
  let hayNoDisponibles = false;

  contenedor.innerHTML = carritoCompras.map((item, idx) => {
    const prodReal = obtenerProductoActualizado(item.tiendaId, item.prodKey, item.nombre);
    const stockReal = prodReal ? Number(prodReal.stock) : 0;
    const precioActual = prodReal ? Number(prodReal.precio) : Number(item.precio);
    item.precio = precioActual;

    const agotado = stockReal <= 0;
    const excedeStock = !agotado && item.cantidad > stockReal;
    const noDisponible = agotado || excedeStock;
    if (noDisponible) hayNoDisponibles = true;

    const subtotal = precioActual * item.cantidad;
    totalGeneral += subtotal;

    let avisoStockHtml = '';
    if (agotado) {
      avisoStockHtml = `<span class="cart-item-warning"><i data-lucide="alert-circle"></i> No disponible (agotado en tienda)</span>`;
    } else if (excedeStock) {
      avisoStockHtml = `<span class="cart-item-warning"><i data-lucide="alert-triangle"></i> Cantidad no disponible (solo quedan ${stockReal} ${item.unidad})</span>`;
    }

    return `
      <div class="cart-item-card ${noDisponible ? 'unavailable' : ''}">
        <div class="cart-item-info">
          <strong>${item.nombre}</strong>
          <div class="cart-item-meta">${item.tiendaNombre} · $${precioActual.toFixed(2)} / ${item.unidad} · Subtotal: <strong>$${subtotal.toFixed(2)}</strong></div>
          ${avisoStockHtml}
        </div>
        <div class="cart-item-controls">
          <button type="button" class="cart-qty-btn" onclick="modificarCantidadCarrito(${idx}, -1)" title="Disminuir">-</button>
          <span class="cart-qty-val">${item.cantidad} ${item.unidad}</span>
          <button type="button" class="cart-qty-btn" onclick="modificarCantidadCarrito(${idx}, 1)" title="Aumentar">+</button>
          <button type="button" class="btn-remove-cart-item" onclick="eliminarItemCarrito(${idx})" title="Quitar del carrito">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = `$${totalGeneral.toFixed(2)} MXN`;
  if (checkoutBox) checkoutBox.classList.remove('hidden');

  if (alertBox) {
    if (hayNoDisponibles) {
      alertBox.innerHTML = `<i data-lucide="alert-triangle"></i><span>Uno o más artículos de tu carrito ya no están disponibles o superan el stock actual de la tienda. Ajusta la cantidad o quítalos para continuar.</span>`;
      alertBox.classList.remove('hidden');
    } else {
      alertBox.classList.add('hidden');
    }
  }

  if (btnConfirmar) {
    btnConfirmar.disabled = hayNoDisponibles;
    btnConfirmar.style.opacity = hayNoDisponibles ? '0.55' : '1';
    btnConfirmar.style.cursor = hayNoDisponibles ? 'not-allowed' : 'pointer';
  }

  lucide.createIcons();
}

function modificarCantidadCarrito(index, delta) {
  const item = carritoCompras[index];
  if (!item) return;

  const prodReal = obtenerProductoActualizado(item.tiendaId, item.prodKey, item.nombre);
  const stockReal = prodReal ? Number(prodReal.stock) : 0;
  const paso = esUnidadContinua(item.unidad) ? 0.5 : 1;
  const nuevaCant = Math.round((item.cantidad + delta * paso) * 100) / 100;

  if (nuevaCant <= 0) {
    eliminarItemCarrito(index);
    return;
  }

  if (delta > 0 && stockReal > 0 && nuevaCant > stockReal) {
    item.cantidad = stockReal;
  } else {
    item.cantidad = nuevaCant;
  }

  guardarCarritoLocal();
  renderizarCarrito();
}

function eliminarItemCarrito(index) {
  carritoCompras.splice(index, 1);
  guardarCarritoLocal();
  renderizarCarrito();
}

function seleccionarMetodoPago(metodo) {
  metodoPagoSeleccionado = metodo;
  document.getElementById('choice-pago-online')?.classList.toggle('active', metodo === 'online');
  document.getElementById('choice-pago-tienda')?.classList.toggle('active', metodo === 'tienda');
  document.getElementById('online-payment-box')?.classList.toggle('hidden', metodo !== 'online');
}

async function confirmarPedidoCarrito() {
  const msgBox = document.getElementById('cart-checkout-msg');
  if (msgBox) {
    msgBox.classList.add('hidden');
    msgBox.classList.remove('ok');
  }

  if (carritoCompras.length === 0) return;

  // Verificar nuevamente stock en vivo antes de generar el pedido al vendedor
  for (const item of carritoCompras) {
    const prodReal = obtenerProductoActualizado(item.tiendaId, item.prodKey, item.nombre);
    const stockReal = prodReal ? Number(prodReal.stock) : 0;
    if (stockReal <= 0 || item.cantidad > stockReal) {
      renderizarCarrito();
      return;
    }
  }

  if (metodoPagoSeleccionado === 'online') {
    const titular = document.getElementById('pago-titular')?.value.trim();
    const terminacion = document.getElementById('pago-terminacion')?.value.trim();
    if (!titular || !terminacion || terminacion.length < 4) {
      if (msgBox) {
        msgBox.textContent = 'Ingresa el nombre del titular y los últimos 4 dígitos de tu tarjeta para procesar el pago en línea.';
        msgBox.classList.remove('hidden');
      }
      return;
    }
  }

  // Agrupar por tienda para enviar cada pedido al vendedor correspondiente
  const porTienda = {};
  carritoCompras.forEach(item => {
    if (!porTienda[item.tiendaId]) {
      porTienda[item.tiendaId] = {
        tiendaId: item.tiendaId,
        tiendaNombre: item.tiendaNombre,
        items: [],
        total: 0
      };
    }
    porTienda[item.tiendaId].items.push({ ...item });
    porTienda[item.tiendaId].total += item.precio * item.cantidad;
  });

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const nombreComprador = usuarioActual?.nombre || 'Comprador Local';

  for (const grupo of Object.values(porTienda)) {
    // Descontar existencias reales de cada producto comprado
    grupo.items.forEach(it => {
      const prodReal = obtenerProductoActualizado(it.tiendaId, it.prodKey, it.nombre);
      if (prodReal) {
        prodReal.stock = Math.max(0, Math.round((Number(prodReal.stock) - it.cantidad) * 100) / 100);
      }
      if (it.tiendaId === 'tienda-1') {
        salidasTurno += 1;
      }
    });

    const tiendaObj = tiendasRegistradas.find(t => t.id === grupo.tiendaId);
    if (tiendaObj) {
      tiendaObj.ventasTotales = (tiendaObj.ventasTotales || 0) + 1;
    }

    const nuevoPedido = {
      id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      tiendaId: grupo.tiendaId,
      tiendaNombre: grupo.tiendaNombre,
      compradorNombre: nombreComprador,
      items: grupo.items,
      total: Math.round(grupo.total * 100) / 100,
      metodoPago: metodoPagoSeleccionado === 'online' ? 'Pagado en línea' : 'Pagar en tienda al recoger',
      pagadoOnline: metodoPagoSeleccionado === 'online',
      estado: 'pendiente', // 'pendiente' -> 'despachando' -> 'listo' -> 'entregado'
      horaCreacion: hora,
      horaActualizacion: hora
    };

    pedidosClientes.unshift(nuevoPedido);
    await DB_HOOKS.crearPedidoCliente(nuevoPedido);
  }

  carritoCompras = [];
  guardarCarritoLocal();
  guardarPedidosClientesLocal();

  renderizarInventario();
  renderizarSeccionTemporadaAlta();
  actualizarListaReabastecimiento();
  actualizarEstadoPromocionVendedor();
  MAP_HOOKS.renderizarMarcadores(MAP_HOOKS.ultimaListaFiltrada || tiendasRegistradas);

  cambiarTabModalCarrito('pedidos');
}

function obtenerEtiquetaEstadoPedido(estado, rol = 'comprador') {
  if (rol === 'comprador') {
    if (estado === 'pendiente') {
      return { clase: 'status-pendiente', icono: 'clock', texto: 'Pedido enviado · Esperando despacho del vendedor' };
    }
    if (estado === 'despachando') {
      return { clase: 'status-despachando', icono: 'package-open', texto: 'Vendedor despachando tu pedido' };
    }
    if (estado === 'listo') {
      return { clase: 'status-listo', icono: 'check-circle-2', texto: '¡Listo! Puedes pasar a recoger en tienda' };
    }
    return { clase: 'status-entregado', icono: 'badge-check', texto: 'Pedido entregado' };
  }

  if (estado === 'pendiente') {
    return { clase: 'status-pendiente', icono: 'bell-ring', texto: 'Nuevo pedido recibido' };
  }
  if (estado === 'despachando') {
    return { clase: 'status-despachando', icono: 'loader', texto: 'Despachando pedido' };
  }
  if (estado === 'listo') {
    return { clase: 'status-listo', icono: 'store', texto: 'Listo para pasar a recoger' };
  }
  return { clase: 'status-entregado', icono: 'check', texto: 'Entregado al cliente' };
}

function renderizarPedidosComprador() {
  const contenedor = document.getElementById('lista-pedidos-comprador');
  if (!contenedor) return;

  if (pedidosClientes.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-box">
        <i data-lucide="package"></i>
        <p>Aún no has confirmado ningún pedido. Cuando pagues en línea o confirmes pago en tienda, podrás seguir el despacho aquí en tiempo real.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  contenedor.innerHTML = pedidosClientes.map(ped => {
    const infoEstado = obtenerEtiquetaEstadoPedido(ped.estado, 'comprador');
    const resumenItems = ped.items.map(i => `${i.cantidad} ${i.unidad} de ${i.nombre}`).join(', ');
    const esListo = ped.estado === 'listo';

    return `
      <div class="order-card ${esListo ? 'ready-pickup' : ''}">
        <div class="order-card-header">
          <span class="order-id">${ped.id} · ${ped.tiendaNombre}</span>
          <span class="order-status-pill ${infoEstado.clase}">
            <i data-lucide="${infoEstado.icono}"></i>
            <span>${infoEstado.texto}</span>
          </span>
        </div>
        <div class="order-items-summary"><strong>Artículos:</strong> ${resumenItems}</div>
        <div class="order-meta-row">
          <span>Total: <strong>$${Number(ped.total).toFixed(2)} MXN</strong></span>
          <span>Forma de pago: <strong>${ped.metodoPago}</strong></span>
          <span>Actualizado: ${ped.horaActualizacion}</span>
        </div>
        <div class="order-progress-track">
          <div class="order-step ${['pendiente', 'despachando', 'listo', 'entregado'].includes(ped.estado) ? 'done' : ''} ${ped.estado === 'pendiente' ? 'current' : ''}">1. Recibido</div>
          <div class="order-step ${['despachando', 'listo', 'entregado'].includes(ped.estado) ? 'done' : ''} ${ped.estado === 'despachando' ? 'current' : ''}">2. Vendedor despachando</div>
          <div class="order-step ${['listo', 'entregado'].includes(ped.estado) ? 'done' : ''} ${ped.estado === 'listo' ? 'current' : ''}">3. Pasar a recoger</div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderizarPedidosVendedor() {
  const contenedor = document.getElementById('lista-pedidos-clientes');
  if (!contenedor) return;

  if (pedidosClientes.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-box">
        <i data-lucide="inbox"></i>
        <p>Los pedidos pagados en línea o confirmados para pago en tienda aparecerán aquí automáticamente para su despacho.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  contenedor.innerHTML = pedidosClientes.map(ped => {
    const infoEstado = obtenerEtiquetaEstadoPedido(ped.estado, 'vendedor');
    const resumenItems = ped.items.map(i => `${i.cantidad} ${i.unidad} de ${i.nombre}`).join(', ');

    let botonAccionHtml = '';
    if (ped.estado === 'pendiente') {
      botonAccionHtml = `
        <button type="button" class="btn-primary btn-sm" onclick="avanzarEstadoPedido('${ped.id}', 'despachando')">
          <i data-lucide="package-open"></i> Despachar
        </button>
      `;
    } else if (ped.estado === 'despachando') {
      botonAccionHtml = `
        <button type="button" class="btn-primary btn-sm" onclick="avanzarEstadoPedido('${ped.id}', 'listo')">
          <i data-lucide="check-circle-2"></i> Listo, pasar a recoger
        </button>
      `;
    } else if (ped.estado === 'listo') {
      botonAccionHtml = `
        <button type="button" class="btn-ghost btn-sm" onclick="avanzarEstadoPedido('${ped.id}', 'entregado')">
          <i data-lucide="badge-check"></i> Marcar como entregado
        </button>
      `;
    }

    return `
      <div class="order-card ${ped.estado === 'listo' ? 'ready-pickup' : ''}">
        <div class="order-card-header">
          <span class="order-id">${ped.id} · Cliente: ${ped.compradorNombre}</span>
          <span class="order-status-pill ${infoEstado.clase}">
            <i data-lucide="${infoEstado.icono}"></i>
            <span>${infoEstado.texto}</span>
          </span>
        </div>
        <div class="order-items-summary"><strong>Pedido:</strong> ${resumenItems}</div>
        <div class="order-meta-row">
          <span>Total: <strong>$${Number(ped.total).toFixed(2)} MXN</strong></span>
          <span>${ped.metodoPago}</span>
          <span>Hora: ${ped.horaCreacion}</span>
        </div>
        ${botonAccionHtml ? `<div class="order-actions-row">${botonAccionHtml}</div>` : ''}
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

async function avanzarEstadoPedido(pedidoId, nuevoEstado) {
  const pedido = pedidosClientes.find(p => p.id === pedidoId);
  if (!pedido) return;

  pedido.estado = nuevoEstado;
  pedido.horaActualizacion = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  await DB_HOOKS.actualizarEstadoPedido(pedidoId, nuevoEstado);
  guardarPedidosClientesLocal();
}

// Sincronización automática en tiempo real si el usuario abre comprador y vendedor en pestañas distintas
window.addEventListener('storage', e => {
  if (e.key === 'nexolocal_pedidos_clientes') {
    pedidosClientes = JSON.parse(e.newValue || '[]');
    actualizarBadgesCarrito();
    renderizarPedidosVendedor();
    renderizarPedidosComprador();
  }
});

// Inicializar selects por defecto, solicitar permiso de ubicación al entrar y restaurar sesión
poblarSelectCategorias('prod-categoria');
actualizarSubcategoriasModal('Producción Local');
actualizarBadgesCarrito();
renderizarPedidosVendedor();
solicitarUbicacionUsuario(false);

const sesionGuardada = localStorage.getItem('nexolocal_sesion');
if (sesionGuardada) {
  usuarioActual = JSON.parse(sesionGuardada);
  aplicarSesion();
}
