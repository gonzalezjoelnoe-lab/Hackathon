export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      accion: 'CONSULTA',
      aprobado: false,
      razon: 'Falta configurar GEMINI_API_KEY en las variables de entorno de Vercel.',
      mensaje_usuario: 'Falta configurar GEMINI_API_KEY en Vercel para activar el asistente.'
    });
  }

  const {
    modo = 'COMPRADOR',
    mensaje = '',
    imagenBase64 = null,
    mimeType = 'image/jpeg',
    contextoProductos = [],
    retoVerificacion = ''
  } = req.body || {};

  let systemInstruction = '';
  const parts = [];

  // =========================================================================
  // 1. ASISTENTE DE BÚSQUEDA PARA EL COMPRADOR
  // =========================================================================
  if (modo === 'COMPRADOR') {
    systemInstruction = `
Eres el Asistente de Búsqueda Inteligente de NexoLocal, una plataforma de comercio de barrio y productores directos.
Tu función es ayudar al comprador a encontrar productos reales en existencia, comparar cercanía y sugerir opciones útiles.

REGLAS ESTRICTAS:
1. Basa tus recomendaciones ÚNICAMENTE en el catálogo en existencia proporcionado en "CATÁLOGO DISPONIBLE". Nunca inventes tiendas, precios ni productos que no estén en la lista.
2. Cuando recomiendes artículos, menciona siempre: nombre del producto, precio con unidad, stock disponible, nombre de la tienda y distancia en km.
3. Si el comprador pide opciones cercanas, ordena priorizando los negocios con menor "distanciaKm".
4. Si pide productores directos o sin intermediarios, prioriza los artículos de categoría "Producción Local".
5. Si escribe con errores ortográficos, modismos (ej. "chela", "jitomate", "keso") o pide ingredientes para una receta/ocasión (ej. "para hacer salsa", "carnita asada"), relaciona inteligentemente los productos disponibles.
6. Si lo que pide no está disponible, indícalo con claridad y sugiere la alternativa más cercana del catálogo.
7. Formato de respuesta: usa texto limpio, viñetas con "•" y saltos de línea claros. NO uses asteriscos de Markdown (**) ni etiquetas HTML. Sé breve, amable y directo (máximo 120 palabras).

Debes responder SIEMPRE con este objeto JSON exacto:
{
  "mensaje_usuario": "Tu respuesta clara y útil para el comprador"
}
    `.trim();

    parts.push({
      text: `CATÁLOGO DISPONIBLE EN TIENDAS (JSON):\n${JSON.stringify(contextoProductos)}\n\nCONSULTA DEL COMPRADOR:\n"${mensaje}"`
    });
  }

  // =========================================================================
  // 2. ASISTENTE OPERATIVO Y DE AYUDA PARA EL VENDEDOR
  // =========================================================================
  else if (modo === 'VENDEDOR') {
    systemInstruction = `
Eres el Asistente Operativo y de Ayuda para Negocios de NexoLocal.
Ayudas al vendedor/productor en tres tareas principales:

TAREA A — ALTA DE PRODUCTO NUEVO (accion: "PUBLICAR"):
- Se activa cuando el vendedor envía una FOTO de un producto nuevo o pide registrar/agregar un artículo nuevo al catálogo (ej. "Agrega 20 kg de Aguacate a $65", o adjunta foto con precio/cantidad).
- Si envía foto sin texto, identifica el producto visible en la imagen, estima una categoría/subcategoría válida y asigna cantidad 1 (o la visible) y precio 0 si no lo indicó.
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
- Se activa cuando el vendedor reporta compras, surtido, ventas o mermas de un producto QUE YA EXISTE en "INVENTARIO ACTUAL" (ej. "Entraron 15 kg de Tomate", "Vendí 3 litros de miel", "Salieron 4 costales de maíz").
- Busca el artículo correspondiente en "INVENTARIO ACTUAL" y devuelve su "producto_id" exacto.
- "tipo_movimiento" debe ser "ENTRADA" (si entró/compró/cosechó) o "SALIDA" (si vendió/salió/despachó).

TAREA C — AYUDA, ANÁLISIS Y ASESORÍA DE NEGOCIO (accion: "CONSULTA"):
- Se activa cuando el vendedor pregunta sobre su inventario (ej. "¿Qué me falta resurtir?", "¿Cuál es mi producto más caro?"), pide consejos de precios/márgenes, o pregunta cómo usar las funciones de NexoLocal (Temporada Alta, verificación humana, promociones o proveedores).
- Responde con recomendaciones prácticas basadas en su "INVENTARIO ACTUAL".

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
  }

  // =========================================================================
  // 3. VALIDACIÓN VISUAL EN VIVO DEL NEGOCIO
  // =========================================================================
  else if (modo === 'VERIFICAR_HUMANO') {
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
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
      console.error('Error Gemini API:', data);
      return res.status(response.status).json({
        accion: 'CONSULTA',
        aprobado: false,
        razon: data?.error?.message || 'Error al consultar Gemini.',
        mensaje_usuario: 'El asistente tuvo un problema temporal al responder. Intenta de nuevo.'
      });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleanJson);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error interno /api/chat:', error);
    return res.status(500).json({
      accion: 'CONSULTA',
      aprobado: false,
      razon: 'Error interno al procesar la respuesta de IA.',
      mensaje_usuario: 'No se pudo procesar la respuesta del asistente en este momento.'
    });
  }
}
