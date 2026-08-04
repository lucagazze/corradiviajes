const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function getBearerToken(req: Request) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function isAdminRequest(req: Request) {
  const token = getBearerToken(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !supabaseUrl || !anonKey) return false;

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!authResponse.ok) return false;
  const user = await authResponse.json();
  if (!user?.id) return false;

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/pv_profiles?select=role&id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  if (!profileResponse.ok) return false;
  const profiles = await profileResponse.json();
  return profiles?.[0]?.role === "admin";
}

function cleanOpenAIError(status: number, raw: string) {
  try {
    const parsed = JSON.parse(raw);
    const message = parsed?.error?.message || parsed?.message;
    if (message) return `OpenAI respondió con error ${status}: ${message}`;
  } catch (_) {
    // The provider occasionally returns plain text instead of JSON.
  }
  return `OpenAI respondió con error ${status}: ${raw.slice(0, 500)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    if (!(await isAdminRequest(req))) return json({ error: "No autorizado" }, 401);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Falta configurar OPENAI_API_KEY en Supabase" }, 500);

    const body = await req.json();
    const place = typeof body?.place === "string" ? body.place.trim() : "";
    if (!place) return json({ error: "Falta el destino" }, 400);
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5-mini";
    const isReasoningModel = /^(gpt-5|o[1-9])/i.test(model);

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_completion_tokens: 2200,
        ...(isReasoningModel ? { reasoning_effort: "low" } : { temperature: 0.3 }),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Sos un guía turístico profesional de Corradi Viajes. Respondé únicamente con un objeto JSON válido. No inventes datos prácticos que puedan inducir a error.",
          },
          {
            role: "user",
            content: `Generá una guía clara y útil para ${place}. Incluí moneda, idioma, huso horario, enchufe, mejor_epoca, clima, resumen y listas de lugares para visitar, gastronomia, cultura y tips. Cada elemento de las listas debe ser {"nombre":"...","desc":"..."}. Usá información general estable y marcá como recomendación cualquier dato que deba verificarse antes de viajar. Devolvé exactamente estas claves: moneda, idioma, huso, enchufe, mejor_epoca, clima, resumen, lugares, gastronomia, cultura, tips.`,
          },
        ],
      }),
    });

    const raw = await openAIResponse.text();
    if (!openAIResponse.ok) {
      console.error("OpenAI destination request failed", openAIResponse.status, raw.slice(0, 1000));
      return json({ error: cleanOpenAIError(openAIResponse.status, raw) }, 502);
    }

    let completion;
    try {
      completion = JSON.parse(raw);
    } catch (_) {
      return json({ error: "OpenAI devolvió una respuesta inválida" }, 502);
    }
    const text = completion?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return json({ error: "OpenAI no devolvió contenido" }, 502);

    let content;
    try {
      content = JSON.parse(text);
    } catch (_) {
      return json({ error: "OpenAI devolvió una guía que no es JSON válido" }, 502);
    }
    return json({ content, model });
  } catch (error) {
    console.error("dest-ia error", error);
    return json({ error: error instanceof Error ? error.message : "Error interno al generar la guía" }, 500);
  }
});
