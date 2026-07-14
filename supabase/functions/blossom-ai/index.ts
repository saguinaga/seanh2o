/**
 * Blossom Life — xAI Grok 4.5 NPC chat proxy for production.
 * Deploy: supabase secrets set XAI_API_KEY=... && supabase functions deploy blossom-ai --no-verify-jwt
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const XAI_BASE = "https://api.x.ai/v1";
const XAI_MODEL = "grok-4.5-latest";
const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function subpath(url: URL) {
  const p = url.pathname;
  const i = p.indexOf("/blossom-ai");
  return i >= 0 ? p.slice(i + "/blossom-ai".length) || "/" : p;
}

function personaFor(ctx: Record<string, unknown>) {
  const near = String(ctx.nearLabel || "").toLowerCase();
  const loc = String(ctx.loc || "");
  if (near.includes("bonnie")) {
    return "Bonnie — salon owner on Main Street HB, warm mentor, grew up near 9th Street.";
  }
  if (near.includes("surfing museum") || near.includes("surf museum")) {
    return "Curator — International Surfing Museum on PCH, Surf City history, boards from every era.";
  }
  if (near.includes("main st & pch") || near.includes("pch intersection")) {
    return "Local — Main Street & PCH corner, points you toward Pacific City and the pier.";
  }
  if (near.includes("pacific city") || near.includes("plant food") || near.includes("mendocino")
    || near.includes("steelcraft") || near.includes("boots") || near.includes("strand")) {
    return "Jordan — Pacific City regular, boardwalk shops, The Strand, sunset walks to the pier.";
  }
  if (loc === "pacCity") {
    return "Pacific City locals — boardwalk, City Beach, US Open zone, fire rings, Strand to the pier.";
  }
  if (loc === "pch") {
    return "PCH locals — highway breeze, surf museum, gateway to Pacific City and Main Street.";
  }
  if (near.includes("sugar shack")) {
    return "Lynn — Sugar Shack Cafe on Main Street, breakfast regulars, knows every surfer's order.";
  }
  if (near.includes("jan's") || near.includes("jans") || near.includes("health bar")) {
    return "Alex — Jan's Health Bar on Main, smoothies and bowls, wellness crowd, local since forever.";
  }
  if (near.includes("no ka oi") || near.includes("nokaoi")) {
    return "Kai — No Ka Oi on Main Street, Hawaiian plates, island aloha, HB local favorite.";
  }
  if (near.includes("wahoo") || near.includes("café") || near.includes("cafe") || near.includes("taco")) {
    return "Eddie — crew at Wahoo's Fish Tacos on Main (started in HB!), lunch expert, knows every regular.";
  }
  if (near.includes("boutique") || near.includes("bloom")) {
    return "Jade — stylist at Bloom Boutique on Main, fashion-forward, downtown HB native.";
  }
  if (near.includes("market") || near.includes("grocery")) {
    return "Rosa — clerk at downtown market on Main, Sunday farmers market gossip, fresh produce tips.";
  }
  if (near.includes("wellness") || near.includes("main st wellness")) {
    return "Dr. Kim — Main St Wellness coach, calm and encouraging, PCH morning walks.";
  }
  if (near.includes("beach") || near.includes("workout") || near.includes("trainer") || near.includes("gym")
    || near.includes("us open") || near.includes("fire ring") || near.includes("lifeguard")) {
    return "Tyler — City Beach trainer in Pacific City, sand reps, US Open week energy, pier runs.";
  }
  if (near.includes("ruby")) {
    return "Dana — host at Ruby's Diner on the Huntington Beach Pier, burgers, shakes, pier history.";
  }
  if (near.includes("art center") || near.includes("broadway")) {
    return "Mia — HB Art Center on Main Street, theater kid energy, knows every local show.";
  }
  if (near.includes("pier") || loc === "park") {
    return "Lifeguard Pat — Huntington City Beach & pier, shorebirds, volleyball, Ruby's at the end.";
  }
  if (loc === "street") {
    return "Locals on Main Street HB — Sugar Shack, Jan's, No Ka Oi, Wahoo's, Bonnie's, pier at PCH.";
  }
  if (loc === "yard") {
    return "Neighbor Sam — alley toward Main & PCH, mailbox/trash tips, walks to Wahoo's.";
  }
  if (loc === "house") {
    return "Mom — 9th Street cottage a few blocks from Main, chores, meals, proud HB parent energy.";
  }
  return "A friendly Huntington Beach local who lives near Main Street and walks to the pier.";
}

function npcSystemPrompt(ctx: Record<string, unknown>) {
  const persona = personaFor(ctx);
  const undone = ctx.undoneChores as string[] | undefined;
  const mealsLeft = ctx.mealsLeft as string[] | undefined;
  const chores = undone?.length
    ? `Today's undone chores: ${undone.join(", ")}.`
    : "All listed chores done for now.";
  const meals = mealsLeft?.length
    ? `Meals still needed: ${mealsLeft.join(", ")}.`
    : "All meals eaten today.";
  const loop = ctx.worldLoop || "9th St → Main Street → PCH → Pacific City → Pier";
  return [
    `You are an NPC in "Blossom Life" — a cozy 3D life-sim in Huntington Beach, California. Open world: ${loop}.`,
    `Speak ONLY as: ${persona}`,
    `Player "${ctx.name || "You"}" · Level ${ctx.level || 1} · ${ctx.stars || 0}/${ctx.starGoal || 50} stars · $${ctx.money ?? 10}.`,
    `Zone: ${ctx.locationName || ctx.zoneLabel || ctx.loc} · ${ctx.phase || "morning"} · Dream path: ${ctx.career || "salon"}.`,
    `Nearby: ${ctx.nearLabel || "open area"}. ${chores} ${meals}`,
    "Rules:",
    '- Reply in character. Format exactly: "Name: dialogue" (speaker name, colon, then words).',
    "- 2-3 vivid sentences. Warm Surf City energy — Main St eats, PCH breeze, Pacific City boardwalk, Ruby's pier.",
    "- Give practical game tips when asked (chores, meals, walk east to Pacific City/pier, career shifts, stars).",
    "- Never mention AI, APIs, models, or being a language model.",
    "- Stay under 320 characters total.",
  ].join("\n");
}

function buildMessages(payload: { message?: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] }) {
  const { message, context, history } = payload;
  const messages: { role: string; content: string }[] = [
    { role: "system", content: npcSystemPrompt(context || {}) },
  ];
  (history || []).slice(-10).forEach((h) => {
    if (h.role && h.content) messages.push({ role: h.role, content: h.content });
  });
  messages.push({ role: "user", content: message || "" });
  return messages;
}

async function xaiChat(messages: { role: string; content: string }[], stream: boolean) {
  return fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages,
      max_tokens: 320,
      temperature: 0.82,
      stream,
    }),
  });
}

async function proxyChat(payload: { message?: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] }) {
  if (!XAI_API_KEY) {
    return { ok: false, error: "no_key", message: "XAI_API_KEY not set on Supabase." };
  }
  const res = await xaiChat(buildMessages(payload), false);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data?.error?.message || data?.message || res.statusText;
    return { ok: false, error: "api_error", message: errMsg };
  }
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: "empty", message: "Empty response from Grok 4.5" };
  return { ok: true, reply: text, model: XAI_MODEL, provider: "xAI" };
}

async function proxyChatStream(
  payload: { message?: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] },
  res: Response,
) {
  if (!XAI_API_KEY) {
    return json({ ok: false, error: "no_key" });
  }
  const xaiRes = await xaiChat(buildMessages(payload), true);
  if (!xaiRes.ok) {
    const data = await xaiRes.json().catch(() => ({}));
    return json({ ok: false, error: "api_error", message: data?.error?.message || xaiRes.statusText });
  }

  const headers = new Headers({
    ...cors,
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = "";
      const reader = xaiRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(enc.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(enc.encode(`data: ${JSON.stringify({ token })}\n\n`));
            } catch { /* skip */ }
          }
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const path = subpath(new URL(req.url));

  if (path === "/health" || path.endsWith("/health")) {
    return json({
      ok: true,
      ai: Boolean(XAI_API_KEY),
      model: XAI_MODEL,
      provider: "xAI",
      stream: true,
    });
  }

  if ((path === "/chat/stream" || path.endsWith("/chat/stream")) && req.method === "POST") {
    try {
      const payload = await req.json();
      return await proxyChatStream(payload, new Response());
    } catch (e) {
      return json({ ok: false, error: "server", message: String(e) }, 500);
    }
  }

  if ((path === "/chat" || path.endsWith("/chat")) && req.method === "POST") {
    try {
      const payload = await req.json();
      const result = await proxyChat(payload);
      return json(result);
    } catch (e) {
      return json({ ok: false, error: "server", message: String(e) }, 500);
    }
  }

  return json({ ok: false, error: "not_found", path }, 404);
});