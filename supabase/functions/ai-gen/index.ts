const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function getBearerToken(req: Request) {
  const value = req.headers.get("authorization") || "";
  return value.replace(/^Bearer\s+/i, "").trim();
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
  const statusHint = status === 401
    ? "La API key de OpenAI es inválida, está vencida o no tiene permisos."
    : status === 404
      ? "El modelo configurado no está disponible para esta API key. Revisá OPENAI_MODEL en Supabase."
      : status === 429
        ? "OpenAI rechazó la solicitud por cuota, crédito disponible o límite de uso. El crédito de ChatGPT no es el mismo que el crédito de la API."
        : "";
  try {
    const parsed = JSON.parse(raw);
    const message = parsed?.error?.message || parsed?.message;
    if (message) return `${statusHint ? `${statusHint} ` : ""}OpenAI respondió con error ${status}: ${message}`;
  } catch (_) {
    // The provider occasionally returns plain text instead of JSON.
  }
  return `${statusHint ? `${statusHint} ` : ""}OpenAI respondió con error ${status}: ${raw.slice(0, 500)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    if (!(await isAdminRequest(req))) return json({ error: "No autorizado" }, 401);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Falta configurar OPENAI_API_KEY en Supabase" }, 500);

    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return json({ error: "Falta el prompt" }, 400);

    const requestedTokens = Number(body?.max_completion_tokens);
    const maxTokens = Math.min(
      Math.max(Number.isFinite(requestedTokens) ? Math.round(requestedTokens) : 4500, 1000),
      6000,
    );
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5-mini";
    const modelOptions = /^gpt-5-mini$/i.test(model)
      ? { reasoning_effort: "low" }
      : { temperature: 0.2 };

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_completion_tokens: maxTokens,
        ...modelOptions,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Sos el motor de armado de viajes de Corradi Viajes. Respondé únicamente con un objeto JSON válido. Respetá literalmente todos los datos operativos aportados por el usuario; no inventes precios, fechas, hoteles, vuelos ni servicios.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const raw = await openAIResponse.text();
    if (!openAIResponse.ok) {
      console.error("OpenAI request failed", openAIResponse.status, raw.slice(0, 1000));
      return json({ error: cleanOpenAIError(openAIResponse.status, raw) }, 502);
    }

    let completion;
    try {
      completion = JSON.parse(raw);
    } catch (_) {
      return json({ error: "OpenAI devolvió una respuesta inválida" }, 502);
    }
    const text = completion?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return json({ error: "OpenAI no devolvió contenido" }, 502);
    }

    return json({ text, model });
  } catch (error) {
    console.error("ai-gen error", error);
    return json({ error: error instanceof Error ? error.message : "Error interno al generar el viaje" }, 500);
  }
});
