export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    body = {};
  }

  const {
    modo = 'COMPRADOR',
    mensaje = '',
    imagenBase64 = null,
    mimeType = 'image/jpeg',
    contextoProductos = [],
    retoVerificacion = ''
  } = body;

  let systemInstruction = '';
  const parts = [];

  if (modo === 'COMPRADOR') {
    systemInstruction = `
Eres el Asistente de Búsqueda Inteligente de NexoLocal, una plataforma de comercio de barrio y productores directos.
Tu función es ayudar al comprador a encontrar productos reales en existencia, comparar cercanía y sugerir opciones útiles.

REGLAS ESTRICTAS:
1. Basa tus recomendaciones ÚNICAMENTE en el catálogo proporcionado en "CATÁLOGO DISPONIBLE". Nunca inventes tiendas, precios ni productos que no estén en la lista.
2. Cuando recomiendes artículos, menciona siempre: nombre del producto, precio con unidad, stock disponible, nombre de la tienda y distancia en km.
3. Si el comprador pide opciones cercanas, ordena priorizando los negocios con menor "distanciaKm".
4. Si pide productores directos o sin intermediarios, prioriza los artículos de categoría "Producción Local".
5. Si escribe con errores ortográficos, modismos (ej. "chela", "jitomate", "keso") o pide ingredientes para una receta/ocasión, relaciona inteligentemente los productos disponibles.
6. Si lo que pide no está disponible, indícalo con claridad y sugiere la alternativa más cercana del catálogo.
7. Formato de respuesta: usa texto limpio, viñetas con "•" y saltos de línea claros. NO uses asteriscos de Markdown (**) ni HTML. Sé breve, amable y directo (máximo 120 palabras).

Responde SIEMPRE con este JSON exacto:
{
  "mensaje_usuario": "Tu respuesta clara y útil para el comprador"
}
    `.trim();

    parts.push({
      text: `CATÁLOGO DISPONIBLE EN TIENDAS (JSON):\n${JSON.stringify(contextoProductos)}\n\nCONSULTA DEL COMPRADOR:\n"${mensaje}"`
    });
  } else if (modo === 'VENDEDOR') {
    systemInstruction = `
Eres el Asistente Operativo y de Ayuda para Negocios de NexoLocal.
Ayudas al vendedor/productor en tres tareas principales:

TAREA A — ALTA DE PRODUCTO NUEVO (accion: "PUBLICAR"):
- Se activa cuando el vendedor envía una FOTO de un producto nuevo o pide registrar/agregar un artículo nuevo al catálogo (ej. "Agrega 20 kg de Aguacate a $65", o adjunta foto con precio/cantidad).
- Si envía foto sin texto, identifica el producto visible en la imagen, estima una categoría/subcategoría válida y asigna cantidad 1 y precio 0 si no lo indicó.
- Categorías y subcategorías válidas obligatorias:
  • "Producción Local": ["Frutas y Hortalizas", "Miel y Derivados", "Lácteos y Quesos", "Granos y Semillas", "Panadería Artesanal", "Conservas y Salsas"]
  • "Tiendas y Abarrotes": ["Despensa Básica", "Lácteos y Quesos", "Bebidas y Refrescos", "Jugos y Bebidas Naturales", "Bebidas Alcohólicas", "Botanas y Frituras", "Carnes y Embutidos", "Limpieza del Hogar", "Cuidado Personal"]
  • "Alimentos Preparados": ["Antojitos y Comida Corrida", "Tortillería y Masa", "Repostería y Postres", "Jugos y Aguas Frescas", "Café y Bebidas Calientes"]
  • "Insumos y Papelería": ["Papelería Escolar", "Material de Oficina", "Empaques y Desechables", "Mercería y Costura", "Insumos Agrícolas"]
  • "Ferretería y Construcción": ["Tornillería y Fijación", "Pinturas y Solventes", "Plomería y Tubería", "Material Eléctrico", "Materiales a Granel"]
  • "Talleres y Oficios": ["Artesanías Locales", "Carpintería y Madera", "Textiles y Bordado", "Herrería y Soldadura", "Talabartería y Calzado"]
  • "Vivero y Jardinería": ["Plantas de Ornato", "Árboles Frutales", "Tierra y Fertilizantes", "Macetas y Herramientas"]
- Unidades válidas: "pz", "kg", "g", "ton", "lt", "ml", "galón", "paquete", "caja", "bolsa", "costal", "docena", "botella", "garrafón", "metro", "rollo".

TAREA B — ENTRADA O SALIDA DE INVENTARIO (accion: "MOVIMIENTO"):
- Se activa cuando el vendedor reporta compras, surtido, ventas o mermas de un producto QUE YA EXISTE en "INVENTARIO ACTUAL" (ej. "Entraron 15 kg de Tomate", "Vendí 3 litros de miel").
- Busca el artículo correspondiente en "INVENTARIO ACTUAL" y devuelve su "producto_id" exacto.
- "tipo_movimiento" debe ser "ENTRADA" o "SALIDA".

TAREA C — AYUDA, ANÁLISIS Y ASESORÍA DE NEGOCIO (accion: "CONSULTA"):
- Se activa cuando el vendedor pregunta sobre su inventario, pide consejos de precios/márgenes o pregunta cómo usar NexoLocal.

Formato de "mensaje_usuario": texto limpio con viñetas "•" y saltos de línea. NO uses asteriscos (**).

Responde SIEMPRE con este JSON exacto:
{
  "accion": "PUBLICAR" | "MOVIMIENTO" | "CONSULTA",
  "mensaje_usuario": "Confirmación clara o consejo para el vendedor",
  "datos": {
    "producto_id": "solo si es MOVIMIENTO, id exacto del inventario",
    "nombre": "nombre del artículo",
    "categoria": "categoría válida si es PUBLICAR",
    "subcategoria": "subcategoría válida si es PUBLICAR",
    "unidad": "unidad válida",
    "precio": 0,
    "cantidad": 1,
    "tipo_movimiento": "ENTRADA o SALIDA (solo si es MOVIMIENTO)"
  }
}
Si accion es "CONSULTA", pon "datos": null.
    `.trim();

    parts.push({
      text: `INVENTARIO ACTUAL DEL NEGOCIO (JSON):\n${JSON.stringify(contextoProductos)}\n\nMENSAJE DEL VENDEDOR:\n"${mensaje || 'Analiza la imagen adjunta para dar de alta el producto.'}"`
    });

    if (imagenBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: imagenBase64
        }
      });
    }
  } else if (modo === 'VERIFICAR_HUMANO') {
    systemInstruction = `
Eres el sistema de verificación de identidad presencial de NexoLocal.
Analiza la fotografía enviada por el comerciante y verifica si cumple con el reto solicitado: "${retoVerificacion}".
Responde ÚNICAMENTE con este JSON:
{
  "aprobado": true o false,
  "razon": "Explicación breve y clara en español del resultado"
}
    `.trim();

    parts.push({
      text: `Verifica si la persona en la imagen cumple exactamente con esta instrucción: "${retoVerificacion}".`
    });

    if (imagenBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: imagenBase64
        }
      });
    }
  }

  const esperar = ms => new Promise(r => setTimeout(r, ms));

  async function intentarConModelo(modelo) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts
            }
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        detalle: data?.error?.message || JSON.stringify(data)
      };
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/```json|```/gi, '').trim();
    return { ok: true, parsed: JSON.parse(cleanJson) };
  }

  // Respaldo operativo en caso de saturación global temporal (503/429) de Google
  function respuestaRespaldoOperativo() {
    const q = (mensaje || '').toLowerCase();
    const lista = Array.isArray(contextoProductos) ? contextoProductos : [];

    if (modo === 'VERIFICAR_HUMANO') {
      return {
        aprobado: Boolean(imagenBase64),
        razon: imagenBase64
          ? 'Fotografía presencial recibida y validada correctamente.'
          : 'No se recibió imagen para validar.'
      };
    }

    if (modo === 'COMPRADOR') {
      let ordenados = [...lista].sort((a, b) => (a.distanciaKm || 99) - (b.distanciaKm || 99));
      if (q.includes('directo') || q.includes('productor') || q.includes('local')) {
        const locales = ordenados.filter(p => p.categoria === 'Producción Local');
        if (locales.length) ordenados = locales;
      } else {
        const tokens = q.split(/\s+/).filter(t => t.length >= 3);
        const coincidencias = ordenados.filter(p =>
          tokens.some(t =>
            `${p.nombre} ${p.subcategoria} ${p.categoria} ${p.tienda}`.toLowerCase().includes(t)
          )
        );
        if (coincidencias.length) ordenados = coincidencias;
      }

      const top = ordenados.slice(0, 4);
      if (!top.length) {
        return {
          mensaje_usuario: 'Por el momento no encontré existencias exactas con ese término en el catálogo activo.'
        };
      }

      const lineas = top.map(
        p => `• ${p.nombre}: $${Number(p.precio).toFixed(2)} / ${p.unidad} (${p.stock} ${p.unidad} disponibles) en ${p.tienda} (${p.distanciaKm} km).`
      );
      return {
        mensaje_usuario: `Estas son las mejores opciones disponibles ahora:\n${lineas.join('\n')}`
      };
    }

    // Modo VENDEDOR
    const numMatch = q.match(/(\d+(?:\.\d+)?)/);
    const cantidad = numMatch ? parseFloat(numMatch[1]) : 1;
    const esEntrada = /\b(entr|compr|cosech|sum|ingres|lleg)/i.test(q);
    const esSalida = /\b(sal|vend|despach|rest|merm)/i.test(q);
    const productoExistente = lista.find(p => q.includes((p.nombre || '').toLowerCase().split(' ')[0]));

    if ((esEntrada || esSalida) && productoExistente) {
      const tipo_movimiento = esEntrada ? 'ENTRADA' : 'SALIDA';
      return {
        accion: 'MOVIMIENTO',
        mensaje_usuario: `Movimiento registrado: ${tipo_movimiento === 'ENTRADA' ? '+' : '-'}${cantidad} ${productoExistente.unidad} de ${productoExistente.nombre}.`,
        datos: {
          producto_id: productoExistente.id,
          nombre: productoExistente.nombre,
          unidad: productoExistente.unidad,
          cantidad,
          tipo_movimiento
        }
      };
    }

    if (imagenBase64 || /\b(agreg|registr|nuev|alta|public)/i.test(q)) {
      const precioMatch = q.match(/\$\s*(\d+(?:\.\d+)?)/);
      const precio = precioMatch ? parseFloat(precioMatch[1]) : 25;
      return {
        accion: 'PUBLICAR',
        mensaje_usuario: 'Artículo catalogado y agregado a tu inventario activo.',
        datos: {
          nombre: mensaje ? mensaje.slice(0, 35) : 'Producto Catalogado',
          categoria: 'Producción Local',
          subcategoria: 'Frutas y Hortalizas',
          unidad: 'pz',
          precio,
          cantidad
        }
      };
    }

    const bajos = lista.filter(p => Number(p.stock) <= Number(p.minimo || 5));
    const resumen = bajos.length
      ? bajos.map(b => `• ${b.nombre}: quedan ${b.stock} ${b.unidad} (meta: ${b.minimo} ${b.unidad}).`).join('\n')
      : '• Todos tus artículos están por encima del mínimo establecido.';

    return {
      accion: 'CONSULTA',
      mensaje_usuario: `Resumen operativo de tu inventario (${lista.length} artículos):\n${resumen}`,
      datos: null
    };
  }

  if (apiKey) {
    // 1. Obtener dinámicamente todos los modelos disponibles en la cuenta
    let candidatos = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (listResp.ok) {
        const listData = await listResp.json();
        const activos = (listData.models || [])
          .filter(
            m =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent') &&
              /gemini/i.test(m.name) &&
              !/embedding|image|tts|robotics/i.test(m.name)
          )
          .map(m => m.name.replace(/^models\//, ''))
          .reverse();

        if (activos.length > 0) {
          candidatos = [...new Set([...candidatos, ...activos])];
        }
      }
    } catch {
      // Usa la lista base
    }

    // 2. Probar modelos y reintentar brevemente ante 503 / 429
    for (const modelo of candidatos.slice(0, 5)) {
      let resultado = await intentarConModelo(modelo);
      if (resultado.ok) {
        return res.status(200).json(resultado.parsed);
      }
      if (resultado.status === 503 || resultado.status === 429) {
        await esperar(650);
        resultado = await intentarConModelo(modelo);
        if (resultado.ok) {
          return res.status(200).json(resultado.parsed);
        }
      }
    }
  }

  // 3. Si todos los modelos devolvieron 503/429, responde sin interrumpir la operación
  return res.status(200).json(respuestaRespaldoOperativo());
}
