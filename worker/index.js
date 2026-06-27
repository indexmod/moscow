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
    // GET TITLE FROM INDEXMOD MD
    // =====================
    if (url.pathname === "/api/title") {
      const page = url.searchParams.get("url");

      try {
        const u = new URL(page);
        const slug = u.pathname.split("/").filter(Boolean).pop();

        const api = `${u.origin}/_get/${slug}`;
        const res = await fetch(api);
        const data = await res.json();

        const content = data.content || "";

        // frontmatter title
        const match = content.match(
          /---[\s\S]*?title:\s*(.+?)[\r\n]+/i
        );

        const title = match?.[1]?.trim();

        return Response.json({
          title: title || data.title || "Untitled"
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
      return Response.json(raw ? JSON.parse(raw) : { cards: [] });
    }

    // =====================
    // SAVE
    // =====================
    if (url.pathname === "/api/save") {
      const data = await req.json();
      await env.MOSCOW_DB.put("state", JSON.stringify(data));
      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }
};

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Moscow</title>

<style>
html,body{
  margin:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#0f0f10;
  font-family:Arial,sans-serif;
}

#workspace{
  position:fixed;
  inset:0;
}

/* NODE */
.node{
  position:absolute;
  display:flex;
  align-items:center;
  gap:10px;
}

/* DOT */
.dot{
  width:10px;
  height:10px;
  border-radius:50%;
  background:#fff;
  cursor:grab;
  flex:none;
}

/* TITLE */
.title{
  color:#fff;
  font-size:20px;
  text-decoration:none;
  cursor:pointer;
}

.title:hover{
  text-decoration:underline;
}

/* DELETE */
.del{
  margin-left:6px;
  color:#fff;
  font-size:18px;
  cursor:pointer;
  opacity:0.6;
}

.del:hover{
  opacity:1;
}
</style>
</head>

<body>

<div id="workspace"></div>

<script>
const workspace = document.getElementById("workspace");
let nodes = [];

// =====================
// PASTE URL
// =====================
document.addEventListener("paste", async (e) => {
  const text = (e.clipboardData || window.clipboardData).getData("text");
  if (!text.startsWith("http")) return;

  const r = await fetch("/api/title?url=" + encodeURIComponent(text));
  const meta = await r.json();

  const node = createNode({
    id: crypto.randomUUID(),
    title: meta.title,
    link: text,
    x: innerWidth/2,
    y: innerHeight/2
  });

  workspace.appendChild(node.el);
  nodes.push(node);
  save();
});

// =====================
// CREATE NODE
// =====================
function createNode(data){

  const el = document.createElement("div");
  el.className = "node";

  el.style.left = (data.x || 100) + "px";
  el.style.top  = (data.y || 100) + "px";

  el.innerHTML = `
    <div class="dot"></div>

    <a class="title"
       href="${data.link}"
       target="_blank">
      ${data.title}
    </a>

    <span class="del">✖</span>
  `;

  const dot = el.querySelector(".dot");
  const del = el.querySelector(".del");

  // DELETE
  del.onclick = () => {
    el.remove();
    nodes = nodes.filter(n => n.id !== data.id);
    save();
  };

  // DRAG
  let drag = false;
  let dx = 0;
  let dy = 0;

  dot.onpointerdown = (e) => {
    drag = true;
    dx = e.clientX - el.offsetLeft;
    dy = e.clientY - el.offsetTop;
  };

  window.onpointermove = (e) => {
    if (!drag) return;
    el.style.left = (e.clientX - dx) + "px";
    el.style.top  = (e.clientY - dy) + "px";
  };

  window.onpointerup = () => {
    if (!drag) return;
    drag = false;
    save();
  };

  return {
    id: data.id,
    el,
    get: () => ({
      id: data.id,
      title: data.title,
      link: data.link,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top)
    })
  };
}

// =====================
// SAVE
// =====================
async function save(){
  await fetch("/api/save", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      cards: nodes.map(n => n.get())
    })
  });
}

// =====================
// LOAD
// =====================
async function load(){
  const res = await fetch("/api/load");
  const data = await res.json();

  for (const item of (data.cards || [])){
    const node = createNode(item);
    workspace.appendChild(node.el);
    nodes.push(node);
  }
}

load();
</script>

</body>
</html>`;
