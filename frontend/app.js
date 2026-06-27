const workspace = document.getElementById("workspace");
const addBtn = document.getElementById("addBtn");

let cards = [];

addBtn.onclick = () => {
  const card = createCard({
    id: crypto.randomUUID(),
    x: 100,
    y: 100,
    title: "Topic",
    link: "https://"
  });

  workspace.appendChild(card.el);
  cards.push(card);
  save();
};

function createCard(data) {
  const el = document.createElement("div");
  el.className = "card";
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";

  el.innerHTML = `
    <div class="handle"></div>
    <div class="title" contenteditable="true">${data.title}</div>
    <div class="link" contenteditable="true">${data.link}</div>
  `;

  const handle = el.querySelector(".handle");
  const title = el.querySelector(".title");
  const link = el.querySelector(".link");

  let drag = false;
  let dx = 0;
  let dy = 0;

  handle.addEventListener("pointerdown", (e) => {
    drag = true;
    dx = e.clientX - el.offsetLeft;
    dy = e.clientY - el.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!drag) return;
    el.style.left = (e.clientX - dx) + "px";
    el.style.top = (e.clientY - dy) + "px";
  });

  handle.addEventListener("pointerup", () => {
    drag = false;
    save();
  });

  title.oninput = save;
  link.oninput = save;

  return {
    id: data.id,
    el,
    getState: () => ({
      id: data.id,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
      title: title.innerText,
      link: link.innerText
    })
  };
}

function save() {
  const state = cards.map(c => c.getState());
  localStorage.setItem("moscow", JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem("moscow");
  if (!raw) return;

  const data = JSON.parse(raw);
  data.forEach(d => {
    const card = createCard(d);
    workspace.appendChild(card.el);
    cards.push(card);
  });
}

load();
