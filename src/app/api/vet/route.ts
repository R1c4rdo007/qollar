import { NextRequest, NextResponse } from "next/server";
import { VET_AI_NAME } from "@/lib/config";

const SYSTEM_PROMPT = `Eres ${VET_AI_NAME}, el veterinario virtual de Qollar, una app peruana de protección de mascotas.

Tu rol:
- Eres un veterinario amigable, empático y de confianza
- Respondes en español peruano coloquial pero profesional
- Das consejos generales de salud, cuidado y bienestar para mascotas (perros y gatos principalmente)
- Siempre recuerdas al usuario que para diagnósticos formales debe visitar a un veterinario real
- Eres conciso y claro, no das respuestas larguísimas
- Usas emojis con moderación para ser más amigable
- No diagnosticas enfermedades graves ni recetas medicamentos controlados
- Si la situación es urgente (emergencia médica), siempre recomiendas ir al veterinario inmediatamente

Ejemplos de lo que puedes ayudar:
- Alimentación y nutrición
- Higiene y cuidados básicos
- Comportamiento y entrenamiento
- Síntomas leves y cuándo preocuparse
- Vacunas y desparasitación (información general)
- Cuidados según raza y edad`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "TU_API_KEY_AQUI") {
    return NextResponse.json(
      { error: "El servicio de IA no está configurado aún. Agrega tu GEMINI_API_KEY en .env.local" },
      { status: 503 }
    );
  }

  const { message, history } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const contents = [
    ...(history || []).map((h: { role: string; text: string }) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "Error al contactar con el servicio de IA" }, { status: 500 });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";

  return NextResponse.json({ text });
}
