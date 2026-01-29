export function upsertConversationItem(conversationsList, convo) {
  let item = conversationsList.querySelector(`[data-peer-id="${convo.peerId}"]`);

  if (!item) {
    item = document.createElement("section");
    item.className = "message-item";
    item.dataset.peerId = convo.peerId;

    item.innerHTML = `
      <section class="person-logo-wrapper" aria-hidden="true">
        <img src="./media/icons/person-circle.svg" alt="person image" aria-hidden="true">
      </section>

      <section class="message-information-wrapper">
        <section class="name-wrapper"><span class="name"></span></section>
        <section class="message-snippet-wrapper"><span class="message"></span></section>
      </section>

      <footer class="message-options-wrapper" aria-label="Conversation actions">
        <button class="hide-wrapper" type="button" aria-label="Open conversation">
          <img src="./media/icons/eye.svg" alt="open icon" aria-hidden="true">
        </button>
        <button class="delete-wrapper" type="button" aria-label="Delete conversation">
          <img src="./media/icons/trash.svg" alt="trash bin" aria-hidden="true">
        </button>
      </footer>
    `;

    conversationsList.appendChild(item);
  }

  item.querySelector(".name").textContent = convo.name || convo.peerId;
  item.querySelector(".message").textContent = convo.lastMessage || "";

  conversationsList.prepend(item);
}

export function removeConversationItem(conversationsList, peerId) {
  conversationsList.querySelector(`[data-peer-id="${peerId}"]`)?.remove();
}

export function clearMessages(list) {
  list.innerHTML = "";
}

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