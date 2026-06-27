let cards = [];

const workspace = document.getElementById("workspace");

// =========================
// 📌 PASTE → AUTO CARD
// =========================
document.addEventListener("paste", (e) => {
  const text = (e.clipboardData || window.clipboardData).getData("text");

  if (!isValidUrl(text)) return;

  const card = createCard({
    id: crypto.randomUUID(),
    title: extractTitle(text),
    link: text,
    x: 200,
    y: 200
  });

  workspace.appendChild(card.el);
  cards.push(card);
  save();
});

// =========================
// 🧱 CREATE CARD
// =========================
function createCard(data) {
  const el = document.createElement("div");
  el.className = "card";
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";

  el.innerHTML = `
    <div class="handle"></div>
    <div contenteditable class="title">${data.title}</div>
    <div contenteditable class="link">${data.link}</div>
  `;

  let drag = false;
  let dx = 0;
  let dy = 0;

  el.querySelector(".handle").onpointerdown = (e) => {
    drag = true;
    dx = e.clientX - el.offsetLeft;
    dy = e.clientY - el.offsetTop;
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

// =========================
// 💾 SAVE
// =========================
async function save() {
  const state = cards.map(c => c.get());

  await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards: state })
  });
}

// =========================
// 📥 LOAD
// =========================
async function load() {
  const res = await fetch("/api/load");
  const data = await res.json();

  (data.cards || []).forEach(d => {
    const card = createCard(d);
    workspace.appendChild(card.el);
    cards.push(card);
  });
}

load();

// =========================
// 🔧 HELPERS
// =========================
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function extractTitle(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\//g, "") || u.hostname;
  } catch {
    return "link";
  }
}
