// public/effects/render.js
export function appendMessage({ list, userId }, msg) {
  const mine = msg.from === userId;

  const box = document.createElement("section");
  box.className = `message-box ${mine ? "outgoing" : "incoming"}`;

  const p = document.createElement("p");
  p.className = "message-text";
  p.textContent = msg.text;

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  box.appendChild(p);
  box.appendChild(time);
  list.appendChild(box);
  list.scrollTop = list.scrollHeight;
}