import { getSessionFromPrompts } from "./actions/auth.js";
import { createSocket, onDirectMessage } from "./actions/socket.js";
import { getChatDom } from "./effects/dom.js";
import { appendMessage } from "./effects/render.js";

export function startChatApp() {
  const { userId, peerId } = getSessionFromPrompts();
  const socket = createSocket(userId);
  const dom = getChatDom();

  onDirectMessage(socket, (msg) => {
    const relevant =
      (msg.from === userId && msg.to === peerId) ||
      (msg.from === peerId && msg.to === userId);

    if (relevant) appendMessage({ list: dom.list, userId }, msg);
  });

  function sendMessage() {
    const text = dom.input.value.trim();
    if (!text) return;

    socket.emit("dm:send", { to: peerId, text }, (ack) => { 
      if (!ack?.ok) console.error("Send failed:", ack);
    });

    dom.input.value = "";
    dom.input.focus();
  }

  dom.sendBtn.addEventListener("click", sendMessage);
  dom.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}
