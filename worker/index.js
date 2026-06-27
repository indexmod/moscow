export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // =====================
    // UI
    // =====================
    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
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
<meta charset="utf-8"/>
<title>Moscow Board</title>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f0f10;
  font-family: Arial;
}

/* MAP LAYER */
#map {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

#map circle {
  opacity: 0.12;
}

/* WORKSPACE */
#workspace {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

/* CARD */
.card {
  position: absolute;
  width: 200px;
  background: #1f1f22;
  padding: 12px;
  border-radius: 14px;
  color: white;
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
}

/* DRAG HANDLE */
.handle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  cursor: grab;
  margin-bottom: 10px;
}

/* FIELDS */
.title, .link {
  outline: none;
  padding: 6px;
  margin-bottom: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  min-height: 18px;
}
</style>
</head>

<body>

<svg id="map">
  <circle cx="300" cy="300" r="180" fill="red"/>
  <circle cx="650" cy="300" r="180" fill="green"/>
  <circle cx="475" cy="180" r="180" fill="blue"/>
  <circle cx="475" cy="480" r="180" fill="yellow"/>
</svg>

<div id="workspace"></div>

<script>
let cards = [];
const workspace = document.getElementById("workspace");

// =====================
// LOAD
// =====================
async function load() {
  const res = await fetch("/api/load");
  const data = await res.json();

  (data.cards || []).forEach(c => {
    const card = createCard(c);
    workspace.appendChild(card.el);
    cards.push(card);
  });
}

// =====================
// CREATE CARD
// =====================
function createCard(data) {
  const el = document.createElement("div");
  el.className = "card";

  el.style.left = (data.x ?? 100) + "px";
  el.style.top = (data.y ?? 100) + "px";

  el.innerHTML = \`
    <div class="handle"></div>
    <div contenteditable class="title">\${data.title ?? ""}</div>
    <div contenteditable class="link">\${data.link ?? ""}</div>
  \`;

  let drag = false;
  let dx = 0;
  let dy = 0;

  const handle = el.querySelector(".handle");

  handle.onpointerdown = (e) => {
    drag = true;
    dx = e.clientX - el.offsetLeft;
    dy = e.clientY - el.offsetTop;
    handle.setPointerCapture(e.pointerId);
  };

  window.onpointermove = (e) => {
    if (!drag) return;
    el.style.left = (e.clientX - dx) + "px";
    el.style.top = (e.clientY - dy) + "px";
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
      x: parseInt(el.style.left || 0),
      y: parseInt(el.style.top || 0),
      title: el.querySelector(".title").innerText,
      link: el.querySelector(".link").innerText
    })
  };
}

// =====================
// SAVE
// =====================
async function save() {
  const state = cards.map(c => c.get());

  await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards: state })
  });
}

load();
</script>

</body>
</html>`;
