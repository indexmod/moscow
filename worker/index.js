export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // UI
    if (url.pathname === "/") {
      return fetch("https://moscow.pages.dev/index.html");
    }

    // LOAD
    if (url.pathname === "/api/load") {
      const raw = await env.MOSCOW_DB.get("state");
      return Response.json(raw ? JSON.parse(raw) : { cards: [] });
    }

    // SAVE
    if (url.pathname === "/api/save") {
      const data = await req.json();
      await env.MOSCOW_DB.put("state", JSON.stringify(data));
      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }
};
