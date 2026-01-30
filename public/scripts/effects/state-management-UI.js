import { clearMessages, appendMessage } from "../effects/render.js";

export function createChatUI({ dom, userId, mqMobile, store }) {
  function setMobileView(view) {
    document.body.classList.toggle("mobile-sidebar", view === "sidebar");
    document.body.classList.toggle("mobile-chat", view === "chat");

    if (dom.sidebarToggle) {
      dom.sidebarToggle.setAttribute("aria-expanded", String(view === "sidebar"));
    }
  }

  function updateEmptyState() {
    const hasItems = dom.conversationsList.querySelector("[data-peer-id]") !== null;
    const hasActive = !!store.activePeerId;
    const shouldShowEmpty = !hasItems || !hasActive;

    document.body.classList.toggle("loading", shouldShowEmpty);

    if (shouldShowEmpty) {
      dom.header.hidden = true;
      dom.list.hidden = true;
      dom.composer.hidden = true;
    }
  }

  function hideRightSide() {
    store.activePeerId = null;
    dom.peerName.textContent = "";
    dom.header.hidden = true;
    dom.list.hidden = true;
    dom.composer.hidden = true;

    clearMessages(dom.list);

    if (mqMobile.matches) setMobileView("sidebar");
    updateEmptyState();
  }

  function openConversation(peerId) {
    store.activePeerId = peerId;
    const convo = store.ensureConversation(peerId);

    dom.peerName.textContent = convo.name || peerId;
    dom.header.hidden = false;
    dom.list.hidden = false;
    dom.composer.hidden = false;

    clearMessages(dom.list);
    convo.messages.forEach((m) => appendMessage({ list: dom.list, userId }, m));

    if (mqMobile.matches) setMobileView("chat");
    updateEmptyState();
  }

  return { setMobileView, updateEmptyState, hideRightSide, openConversation };
}