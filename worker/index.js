export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // =====================
    // UI
    // =====================
    if (url.pathname === "/") {
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    // =====================
    // GET TITLE (FIXED)
    // =====================
    if (url.pathname === "/api/title") {
      const page = url.searchParams.get("url");

      try {
        const u = new URL(page);
        const slug = u.pathname.split("/").filter(Boolean).pop();

        const api = `${u.origin}/_get/${slug}`;
        const res = await fetch(api);
        const data = await res.json();

        // 1. ПРАВИЛЬНЫЙ ВАРИАНТ (основной)
        let title = data.title;

        // 2. fallback если title нет
        if (!title && data.content) {
          const match = data.content.match(
            /---[\s\S]*?title:\s*(.+?)[\r\n]+/i
          );
          title = match?.[1]?.trim();
        }

        return Response.json({
          title: title || "Untitled"
        });

      } catch (e) {
        return Response.json({ title: "Untitled" });
      }
    }

    // =====================
    // LOAD
    // =====================
    if (url.pathname === "/api/load") {
      const raw = await env.MOSCOW_DB.get("state");

      return Response.json(
        raw ? JSON.parse(raw) : { cards: [] }
      );
    }

    // =====================
    // SAVE
    // =====================
    if (url.pathname === "/api/save") {
      const data = await req.json();

      await env.MOSCOW_DB.put(
        "state",
        JSON.stringify(data)
      );

      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }
};
