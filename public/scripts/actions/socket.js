import { upsertConversationItem, removeConversationItem, appendMessage } from "../effects/render.js";
import { runUserNameSearch } from "../actions/search.js";

export function attachChatSocketHandlers({ socket, dom, userId, store, ui, searchState }) {
  const onConfirmed = ({ peerId }) => {
    store.connectedPeers.add(peerId);
    const convo = store.ensureConversation(peerId);

    upsertConversationItem(dom.conversationsList, {
      peerId: convo.peerId,
      name: convo.name,
      lastMessage: convo.lastMessage,
    });

    ui.updateEmptyState();
  };

  const onDeleted = ({ peerId }) => {
    store.connectedPeers.delete(peerId);
    store.conversations.delete(peerId);

    removeConversationItem(dom.conversationsList, peerId);

    if (store.activePeerId === peerId) ui.hideRightSide();
    ui.updateEmptyState();
  };

  const onMsg = (msg) => {
    const peerId = msg.from === userId ? msg.to : msg.from;
    if (!store.connectedPeers.has(peerId)) return;

    const convo = store.ensureConversation(peerId);
    convo.messages.push(msg);
    convo.lastMessage = msg.text;

    upsertConversationItem(dom.conversationsList, {
      peerId: convo.peerId,
      name: convo.name,
      lastMessage: convo.lastMessage,
    });

    const q = dom.searchInput?.value?.trim() ?? "";
    if (q) runUserNameSearch(dom.conversationsList, q, searchState);

    if (store.activePeerId === peerId) {
      appendMessage({ list: dom.list, userId }, msg);
    }
  };

  socket.on("connect:confirmed", onConfirmed);
  socket.on("connect:deleted", onDeleted);

  onDirectMessage(socket, onMsg);

  return function detach() {
    socket.off("connect:confirmed", onConfirmed);
    socket.off("connect:deleted", onDeleted);
    socket.off("dm:receive", onMsg);
  };
}

export function createSocket(userId) {
  const socket = io({ auth: { userId } }); 
  socket.on("connect", () => {
    console.log(`Connected as ${userId} (${socket.id})`);
  });

  socket.on("connect_error", (err) => {
    console.error(" connect_error:", err.message);
  });

  return socket;
}

export function onDirectMessage(socket, handler) {
  socket.on("dm:receive", handler); }