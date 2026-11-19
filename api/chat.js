export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { modo, mensaje, imagenBase64, mimeType, contextoProductos, retoVerificacion } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel' });
  }

  let instrucciones = '';

  if (modo === 'VERIFICAR_HUMANO') {
    instrucciones = `Eres un verificador de identidad en sitio para prevenir fraudes en comercio local.
    Analiza la fotografía adjunta y determina si cumple DOS condiciones:
    1) Aparece una persona real en vivo (no una pantalla, dibujo, objeto solo ni imagen en negro).
    2) Cumple exactamente esta seña solicitada: "${retoVerificacion}".
    Responde ÚNICAMENTE en JSON válido:
    {"aprobado": true o false, "razon": "explicación clara y breve en español"}`;
  } else if (modo === 'VENDEDOR') {
    instrucciones = `Eres el asistente operativo de un negocio o productor local.
    Analiza la solicitud del dueño (y la imagen si adjuntó una) junto con su lista actual de artículos: ${JSON.stringify(contextoProductos || [])}.
    Determina si quiere:
    - "PUBLICAR": registrar un artículo nuevo (extrae nombre, categoría entre [Producción Local, Tiendas y Abarrotes, Insumos y Papelería, Talleres y Oficios], precio numérico y cantidad entera).
    - "MOVIMIENTO": sumar ("ENTRADA") o restar ("SALIDA") existencias de un artículo ya existente en su lista.
    - "CONSULTA": responder una duda sobre su catálogo.
    Responde ÚNICAMENTE en JSON válido:
    {
      "accion": "PUBLICAR" | "MOVIMIENTO" | "CONSULTA",
      "mensaje_usuario": "Confirmación clara y directa",
      "datos": {
        "producto_id": "id si ya existe o null",
        "nombre": "nombre del artículo",
        "categoria": "categoría",
        "precio": 0,
        "cantidad": 1,
        "tipo_movimiento": "ENTRADA" | "SALIDA"
      }
    }`;
  } else {
    instrucciones = `Eres un asistente de descubrimiento de comercio local.
    Catálogo disponible con existencias reales: ${JSON.stringify(contextoProductos || [])}.
    Ayuda al comprador a encontrar qué negocios cercanos tienen lo que busca, indicando precios y existencias reales. No inventes productos que no estén en el catálogo.
    Responde ÚNICAMENTE en JSON válido:
    {
      "mensaje_usuario": "Respuesta clara con opciones reales y precios"
    }`;
  }

  const partes = [{ text: `${instrucciones}\n\nEntrada del usuario: ${mensaje || 'Analizar imagen adjunta'}` }];

  if (imagenBase64) {
    partes.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: imagenBase64
      }
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: partes }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return res.status(200).json(JSON.parse(rawText));
  } catch (error) {
    return res.status(500).json({ error: 'Error procesando solicitud IA', detalle: error.message });
  }
}
