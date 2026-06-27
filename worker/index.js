export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // =====================
    // UI
    // =====================
    if (url.pathname === "/") {
      return fetch("https://moscow.pages.dev/index.html");
    }

    // =====================
    // LOAD STATE
    // =====================
    if (url.pathname === "/api/load") {
      const raw = await env.MAP.get("state");
      return Response.json(raw ? JSON.parse(raw) : { cards: [] });
    }

    // =====================
    // SAVE STATE
    // =====================
    if (url.pathname === "/api/save") {
      const data = await req.json();
      await env.MAP.put("state", JSON.stringify(data));
      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }
};
