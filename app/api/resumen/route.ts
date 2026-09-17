import { NextResponse } from "next/server";

type DatosResumen = {
  usuario?: {
    nombre?: string;
    email?: string;
  };
  finanzas?: Record<string, unknown>;
  eventos?: unknown[];
  deudas?: unknown[];
  metas?: unknown[];
  movimientos?: unknown[];
  estudios?: unknown[];
  examenes?: unknown[];
  trabajos?: unknown[];
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Falta GEMINI_API_KEY en .env.local",
        },
        { status: 500 }
      );
    }

    const datos: DatosResumen = await request.json();

    const nombre = datos.usuario?.nombre || "usuario";

    const prompt = `
Sos el asistente personal de una aplicación privada llamada Vida Privada.

Analizá la información del usuario y generá un resumen útil de su situación actual y de los próximos días.

Usuario: ${nombre}

FINANZAS:
${JSON.stringify(datos.finanzas ?? {}, null, 2)}

EVENTOS:
${JSON.stringify(datos.eventos ?? [], null, 2)}

DEUDAS:
${JSON.stringify(datos.deudas ?? [], null, 2)}

METAS:
${JSON.stringify(datos.metas ?? [], null, 2)}

MOVIMIENTOS:
${JSON.stringify(datos.movimientos ?? [], null, 2)}

ESTUDIOS:
${JSON.stringify(datos.estudios ?? [], null, 2)}

EXÁMENES:
${JSON.stringify(datos.examenes ?? [], null, 2)}

TRABAJOS:
${JSON.stringify(datos.trabajos ?? [], null, 2)}

Respondé en español argentino natural.

Formato:

Una breve introducción sobre la situación actual.

LO MÁS IMPORTANTE
- 2 a 5 puntos realmente relevantes.

PRÓXIMOS DÍAS
- Ordená cronológicamente lo importante.

DINERO
- Resumí ingresos, gastos, balance, saldo y deudas si existen.

ESTUDIOS
- Mencioná exámenes y trabajos próximos si existen.

PRIORIDAD
- Una frase final indicando qué debería tener más presente.

No inventes datos.
No repitas información innecesariamente.
No expliques tu razonamiento.
No digas que sos una IA.
Sé claro, concreto y útil.
`;

    const respuesta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2500,
          },
        }),
      }
    );

    const textoRespuesta = await respuesta.text();

    console.log("========== GEMINI ==========");
    console.log("STATUS:", respuesta.status);
    console.log("RESPUESTA:", textoRespuesta);
    console.log("============================");

    if (!respuesta.ok) {
      let detalle: unknown = textoRespuesta;

      try {
        detalle = JSON.parse(textoRespuesta);
      } catch {
        // dejamos el texto original
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Gemini rechazó la solicitud.",
          status: respuesta.status,
          detalle,
        },
        { status: respuesta.status }
      );
    }

    let resultado: any;

    try {
      resultado = JSON.parse(textoRespuesta);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Gemini respondió algo que no es JSON.",
          detalle: textoRespuesta,
        },
        { status: 500 }
      );
    }

    const candidato = resultado?.candidates?.[0];

    const mensaje = candidato?.content?.parts
      ?.map((parte: { text?: string }) => parte.text || "")
      .join("")
      .trim();

    const finishReason = candidato?.finishReason || null;

    console.log("GEMINI FINISH REASON:", finishReason);
    console.log("GEMINI MENSAJE:", mensaje);

    if (!mensaje) {
      return NextResponse.json(
        {
          ok: false,
          error: "Gemini no devolvió ningún texto.",
          finishReason,
          detalle: resultado,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje,
      finishReason,
    });
  } catch (error) {
    console.error("========== ERROR API RESUMEN ==========");
    console.error(error);
    console.error("=======================================");

    return NextResponse.json(
      {
        ok: false,
        error: "Error interno en la API de resumen.",
        detalle:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}