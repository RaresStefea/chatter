const conversationItemPrototype = (() => {
  const item = document.createElement("section");
  item.className = "message-item";

  const personLogoWrapper = document.createElement("section");
  personLogoWrapper.className = "person-logo-wrapper";
  personLogoWrapper.setAttribute("aria-hidden", "true");

  const personImg = document.createElement("img");
  personImg.src = "../media/icons/person-circle.svg";
  personImg.alt = "person image";
  personImg.setAttribute("aria-hidden", "true");
  personLogoWrapper.appendChild(personImg);

  const messageInfoWrapper = document.createElement("section");
  messageInfoWrapper.className = "message-information-wrapper";

  const nameWrapper = document.createElement("section");
  nameWrapper.className = "name-wrapper";

  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameWrapper.appendChild(nameSpan);

  const snippetWrapper = document.createElement("section");
  snippetWrapper.className = "message-snippet-wrapper";

  const messageSpan = document.createElement("span");
  messageSpan.className = "message";
  snippetWrapper.appendChild(messageSpan);

  messageInfoWrapper.append(nameWrapper, snippetWrapper);

  const footer = document.createElement("footer");
  footer.className = "message-options-wrapper";
  footer.setAttribute("aria-label", "Conversation actions");

  const openBtn = document.createElement("button");
  openBtn.className = "hide-wrapper";
  openBtn.type = "button";
  openBtn.setAttribute("aria-label", "Open conversation");

  const openImg = document.createElement("img");
  openImg.src = "../media/icons/eye.svg";
  openImg.alt = "open icon";
  openImg.setAttribute("aria-hidden", "true");
  openBtn.appendChild(openImg);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-wrapper";
  deleteBtn.type = "button";
  deleteBtn.setAttribute("aria-label", "Delete conversation");

  const deleteImg = document.createElement("img");
  deleteImg.src = "../media/icons/trash.svg";
  deleteImg.alt = "trash bin";
  deleteImg.setAttribute("aria-hidden", "true");
  deleteBtn.appendChild(deleteImg);

  footer.append(openBtn, deleteBtn);

  item.append(personLogoWrapper, messageInfoWrapper, footer);

  return item;
})();

function getPeerSelector(peerId) {
  return `[data-peer-id="${CSS.escape(String(peerId))}"]`;
}

function createConversationItemNode() {
  const node = conversationItemPrototype.cloneNode(true);

  node._nameEl = node.querySelector(".name");
  node._messageEl = node.querySelector(".message");

  return node;
}

export function upsertConversationItem(conversationsList, convo) {
  const peerId = String(convo.peerId);

  let item = conversationsList.querySelector(getPeerSelector(peerId));

  if (!item) {
    item = createConversationItemNode();
    item.dataset.peerId = peerId;
    conversationsList.appendChild(item);
  }

  const nameEl = item._nameEl || (item._nameEl = item.querySelector(".name"));
  const messageEl =
    item._messageEl || (item._messageEl = item.querySelector(".message"));

  nameEl.textContent = (convo.name ?? peerId) || peerId;
  messageEl.textContent = convo.lastMessage ?? "";

  item.dataset.userName = String(convo.name ?? peerId).trim().toLowerCase();

  return item;
}

export function removeConversationItem(conversationsList, peerId) {
  conversationsList.querySelector(getPeerSelector(peerId))?.remove();
}

export function clearMessages(list) {
  while (list.firstChild) list.removeChild(list.firstChild);
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

  box.append(p, time);
  list.appendChild(box);
  list.scrollTop = list.scrollHeight;
}