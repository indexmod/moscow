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
    // GET TITLE
    // =====================
    if (url.pathname === "/api/title") {
      const page = url.searchParams.get("url");

      try {
        const source = await fetch(page).then(r => r.text());

        const match = source.match(
          /title:\s*(.+)/i
        );

        return Response.json({
          title: match?.[1]?.trim() || "Untitled"
        });

      } catch {

        return Response.json({
          title: "Untitled"
        });

      }
    }

    // =====================
    // LOAD
    // =====================
    if (url.pathname === "/api/load") {
      const raw = await env.MOSCOW_DB.get("state");

      return Response.json(
        raw
          ? JSON.parse(raw)
          : { cards: [] }
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

      return Response.json({ ok:true });
    }

    return new Response("not found", {
      status:404
    });
  }
};

const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">

<title>Moscow</title>

<style>

html,
body{
  margin:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#0f0f10;
  font-family:Arial,sans-serif;
}

#map{
  position:fixed;
  inset:0;
  width:100%;
  height:100%;
}

#map circle{
  opacity:.12;
}

#workspace{
  position:fixed;
  inset:0;
}

/* ===================== */
/* NODE */
/* ===================== */

.node{
  position:absolute;

  display:flex;
  align-items:center;
  gap:12px;
}

.handle{
  width:12px;
  height:12px;

  border-radius:50%;
  background:white;

  cursor:grab;
  flex:none;
}

.title{
  color:white;
  text-decoration:none;
  font-size:22px;
}

.title:hover{
  text-decoration:underline;
}

</style>
</head>

<body>

<svg id="map">

<circle
cx="300"
cy="300"
r="180"
fill="red"
/>

<circle
cx="650"
cy="300"
r="180"
fill="green"
/>

<circle
cx="475"
cy="180"
r="180"
fill="blue"
/>

<circle
cx="475"
cy="480"
r="180"
fill="yellow"
/>

</svg>

<div id="workspace"></div>

<script>

const workspace =
document.getElementById("workspace");

let cards = [];

/* ===================== */
/* PASTE */
/* ===================== */

document.addEventListener(
"paste",
async (e)=>{

const text =
(e.clipboardData || window.clipboardData)
.getData("text");

if(!text.startsWith("http"))
return;

const r =
await fetch(
"/api/title?url=" +
encodeURIComponent(text)
);

const meta =
await r.json();

const node =
createNode({

id:crypto.randomUUID(),

title:
meta.title || "Untitled",

link:text,

x:
window.innerWidth/2,

y:
window.innerHeight/2

});

workspace.appendChild(node.el);

cards.push(node);

save();

});

/* ===================== */
/* NODE */
/* ===================== */

function createNode(data){

const el =
document.createElement("div");

el.className = "node";

el.style.left =
(data.x || 100)+"px";

el.style.top =
(data.y || 100)+"px";

el.innerHTML = \`
<div class="handle"></div>

<a
class="title"
href="\${data.link}"
target="_blank"
>
\${data.title}
</a>
\`;

const handle =
el.querySelector(".handle");

let drag = false;
let dx = 0;
let dy = 0;

handle.onpointerdown = e => {

drag = true;

dx =
e.clientX -
el.offsetLeft;

dy =
e.clientY -
el.offsetTop;

};

window.onpointermove = e => {

if(!drag)
return;

el.style.left =
(e.clientX-dx)+"px";

el.style.top =
(e.clientY-dy)+"px";

};

window.onpointerup = ()=>{

if(!drag)
return;

drag = false;

save();

};

return {

id:data.id,

el,

get:()=>({

id:data.id,

title:data.title,

link:data.link,

x:parseInt(el.style.left),

y:parseInt(el.style.top)

})

};

}

/* ===================== */
/* SAVE */
/* ===================== */

async function save(){

const state =
cards.map(c=>c.get());

await fetch("/api/save",{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({
cards:state
})

});

}

/* ===================== */
/* LOAD */
/* ===================== */

async function load(){

const res =
await fetch("/api/load");

const data =
await res.json();

for(const item of
(data.cards || [])){

const node =
createNode(item);

workspace.appendChild(
node.el
);

cards.push(node);

}

}

load();

</script>

</body>
</html>
`;
