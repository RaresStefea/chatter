import { getUserIdFromModal, promptForFriendIdModal } from "./actions/auth.js";
import { createSocket, onDirectMessage } from "./actions/socket.js";
import { createSearchState, runUserNameSearch } from "./actions/search.js";
import { getChatDom } from "./effects/dom.js";
import { upsertConversationItem, removeConversationItem, clearMessages, appendMessage,} from "./effects/render.js";

export async function startChatApp() {
  const { userId } = await getUserIdFromModal();
  const socket = createSocket(userId);
  const dom = getChatDom();

  const mqMobile = window.matchMedia("(max-width: 768px)");
  const searchState = createSearchState();

  function setMobileView(view) {
    document.body.classList.toggle("mobile-sidebar", view === "sidebar");
    document.body.classList.toggle("mobile-chat", view === "chat");

    if (dom.sidebarToggle) {
      dom.sidebarToggle.setAttribute("aria-expanded", String(view === "sidebar"));
    }
  }

  if (mqMobile.matches) setMobileView("sidebar");

  dom.appTitle.textContent = "CHATTER";
  dom.peerName.textContent = "";
  dom.header.hidden = true;
  dom.list.hidden = true;
  dom.composer.hidden = true;

  clearMessages(dom.list);

  socket.once("connect", () => {
    dom.appTitle.textContent = userId;
  });

  const conversations = new Map();  
  const connectedPeers = new Set();  
  let activePeerId = null;

  const controller = new AbortController();
  const { signal } = controller;

  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener(
      "click",
      () => {
        if (!mqMobile.matches) return;
        setMobileView("sidebar");
      },
      { signal }
    );
  }

  function ensureConversation(peerId) {
    if (!conversations.has(peerId)) {
      conversations.set(peerId, {
        peerId,
        name: peerId,
        messages: [],
        lastMessage: "",
      });
    }
    return conversations.get(peerId);
  }

  function updateEmptyState() {
    const hasItems = dom.conversationsList.querySelector("[data-peer-id]") !== null;
    const hasActive = !!activePeerId;

    const shouldShowEmpty = !hasItems || !hasActive;

    document.body.classList.toggle("loading", shouldShowEmpty);

    if (shouldShowEmpty) {
      dom.header.hidden = true;
      dom.list.hidden = true;
      dom.composer.hidden = true;
    }
  }

  function hideRightSide() {
    activePeerId = null;
    dom.peerName.textContent = "";
    dom.header.hidden = true;
    dom.list.hidden = true;
    dom.composer.hidden = true;

    clearMessages(dom.list);

    if (mqMobile.matches) setMobileView("sidebar");
    updateEmptyState();
  }

  function openConversation(peerId) {
    activePeerId = peerId;

    const convo = ensureConversation(peerId);

    updateEmptyState();

    dom.peerName.textContent = convo.name || peerId;
    dom.header.hidden = false;
    dom.list.hidden = false;
    dom.composer.hidden = false;

    clearMessages(dom.list);
    convo.messages.forEach((m) => appendMessage({ list: dom.list, userId }, m));

    if (mqMobile.matches) setMobileView("chat");

    updateEmptyState();
  }

  dom.addUserBtn.addEventListener(
    "click",
    async () => {
      const res = await promptForFriendIdModal();
      if (!res) return;

      ensureConversation(res.peerId);

      socket.emit("connect:request", { peerId: res.peerId }, (ack) => {
        if (!ack?.ok) console.error("connect:request failed:", ack);
      });
    },
    { signal }
  );

  dom.conversationsList.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const item = btn.closest(".message-item");
      const peerId = item?.dataset.peerId;
      if (!peerId) return;

      if (btn.classList.contains("hide-wrapper")) {
        connectedPeers.add(peerId);
        openConversation(peerId);
        return;
      }

      if (btn.classList.contains("delete-wrapper")) {
        socket.emit("connect:delete", { peerId }, (ack) => {
          if (!ack?.ok) console.error("connect:delete failed:", ack);
        });
      }
    },
    { signal }
  );

  const onConfirmed = ({ peerId }) => {
    connectedPeers.add(peerId);
    const convo = ensureConversation(peerId);

    upsertConversationItem(dom.conversationsList, {
      peerId: convo.peerId,
      name: convo.name,
      lastMessage: convo.lastMessage,
    });

    updateEmptyState();
  };

  const onDeleted = ({ peerId }) => {
    connectedPeers.delete(peerId);
    conversations.delete(peerId);
    removeConversationItem(dom.conversationsList, peerId);

    if (activePeerId === peerId) hideRightSide();
    updateEmptyState();
  };

  socket.on("connect:confirmed", onConfirmed);
  socket.on("connect:deleted", onDeleted);

  const onMsg = (msg) => {
    const peerId = msg.from === userId ? msg.to : msg.from;
    if (!connectedPeers.has(peerId)) return;

    const convo = ensureConversation(peerId);
    convo.messages.push(msg);
    convo.lastMessage = msg.text;

    upsertConversationItem(dom.conversationsList, {
      peerId: convo.peerId,
      name: convo.name,
      lastMessage: convo.lastMessage,
    });

    const q = dom.searchInput?.value?.trim() ?? "";
    if (q) runUserNameSearch(dom.conversationsList, q, searchState);

    if (activePeerId === peerId) {
      appendMessage({ list: dom.list, userId }, msg);
    }
  };

  onDirectMessage(socket, onMsg);

  function sendMessage() {
    const text = dom.input.value.trim();
    if (!text || !activePeerId) return;

    socket.emit("dm:send", { to: activePeerId, text }, (ack) => {
      if (!ack?.ok) console.error("Send failed:", ack);
    });

    dom.input.value = "";
    dom.input.focus();
  }

  dom.sendBtn.addEventListener("click", sendMessage, { signal });
  dom.input.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") sendMessage();
    },
    { signal }
  );

  dom.searchInput?.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const q = dom.searchInput.value.trim();
    runUserNameSearch(dom.conversationsList, q, searchState);
  },
  { signal }
  );

  function destroy() {
    controller.abort();
    socket.off("connect:confirmed", onConfirmed);
    socket.off("connect:deleted", onDeleted);
    socket.off("dm:receive", onMsg);
  }

  return { destroy };
}