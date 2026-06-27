export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // GET BOARD
    if (url.pathname === "/api/get") {
      const data = await env.BOARD.get("state");

      return new Response(
        data || JSON.stringify({ cards: [], updatedAt: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // SAVE BOARD
    if (url.pathname === "/api/save") {
      const body = await req.json();

      await env.BOARD.put(
        "state",
        JSON.stringify(body)
      );

      return Response.json({ ok: true });
    }

    return new Response("ok");
  }
};
