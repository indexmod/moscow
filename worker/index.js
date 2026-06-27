export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/api/title") {
      const page = url.searchParams.get("url");

      try {
        const u = new URL(page);
        const slug = u.pathname.split("/").filter(Boolean).pop();
        const api = `${u.origin}/_get/${slug}`;

        const res = await fetch(api);
        const data = await res.json();

        const content = data.content || "";
        const match = content.match(/---[\s\S]*?title:\s*(.+?)[\r\n]+/i);

        return Response.json({
          title: match?.[1]?.trim() || data.title || "Untitled"
        });
      } catch {
        return Response.json({ title: "Untitled" });
      }
    }

    if (url.pathname === "/api/load") {
      const raw = await env.MOSCOW_DB.get("state");
      return Response.json(raw ? JSON.parse(raw) : { cards: [] });
    }

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
  font-family:Arial;
}

#workspace{
  position:fixed;
  inset:0;
}

.node{
  position:absolute;
  display:flex;
  align-items:center;
  gap:10px;
}

.dot{
  width:10px;
  height:10px;
  border-radius:50%;
  background:white;
  cursor:grab;
}

.title{
  color:white;
  text-decoration:none;
  font-size:20px;
}

.del{
  color:white;
  cursor:pointer;
  opacity:0.6;
}
.del:hover{ opacity:1; }
</style>
</head>

<body>

<div id="workspace"></div>

<script>
const ws = document.getElementById("workspace");
let nodes = [];

document.addEventListener("paste", async (e) => {
  const text = e.clipboardData.getData("text");
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

  ws.appendChild(node.el);
  nodes.push(node);
  save();
});

function createNode(d){
  const el = document.createElement("div");
  el.className = "node";

  el.style.left = (d.x||100)+"px";
  el.style.top = (d.y||100)+"px";

  const dot = document.createElement("div");
  dot.className = "dot";

  const a = document.createElement("a");
  a.className = "title";
  a.href = d.link;
  a.target = "_blank";
  a.textContent = d.title;

  const del = document.createElement("span");
  del.className = "del";
  del.textContent = "✖";

  el.appendChild(dot);
  el.appendChild(a);
  el.appendChild(del);

  del.onclick = () => {
    el.remove();
    nodes = nodes.filter(n => n.id !== d.id);
    save();
  };

  let drag=false,dx=0,dy=0;

  dot.onpointerdown = e => {
    drag=true;
    dx=e.clientX-el.offsetLeft;
    dy=e.clientY-el.offsetTop;
  };

  window.onpointermove = e => {
    if(!drag) return;
    el.style.left=(e.clientX-dx)+"px";
    el.style.top=(e.clientY-dy)+"px";
  };

  window.onpointerup = () => {
    drag=false;
    save();
  };

  return {
    id:d.id,
    el,
    get:()=>({
      id:d.id,
      title:d.title,
      link:d.link,
      x:parseInt(el.style.left),
      y:parseInt(el.style.top)
    })
  };
}

async function save(){
  await fetch("/api/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      cards:nodes.map(n=>n.get())
    })
  });
}

async function load(){
  const r = await fetch("/api/load");
  const d = await r.json();

  for(const i of (d.cards||[])){
    const n = createNode(i);
    ws.appendChild(n.el);
    nodes.push(n);
  }
}

load();
</script>

</body>
</html>`;
