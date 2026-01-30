import { getUserIdFromModal } from "./actions/auth.js";
import { createSearchState } from "./actions/search.js";
import { getChatDom } from "./effects/dom.js";
import { clearMessages } from "./effects/render.js";
import { createChatStore } from "./actions/storage.js";
import { createChatUI } from "./effects/state-management-UI.js";
import { attachChatDomEvents } from "./effects/event-handlers.js";
import { attachChatSocketHandlers,createSocket } from "./actions/socket.js";

export async function startChatApp() {
  const { userId } = await getUserIdFromModal();
  const socket = createSocket(userId);
  const dom = getChatDom();

  const mqMobile = window.matchMedia("(max-width: 768px)");
  const searchState = createSearchState();
  const store = createChatStore();

  const controller = new AbortController();
  const { signal } = controller;

  dom.appTitle.textContent = "CHATTER";
  dom.peerName.textContent = "";
  dom.header.hidden = true;
  dom.list.hidden = true;
  dom.composer.hidden = true;
  clearMessages(dom.list);

  const ui = createChatUI({ dom, userId, mqMobile, store });

  if (mqMobile.matches) ui.setMobileView("sidebar");

  socket.once("connect", () => {
    dom.appTitle.textContent = userId;
  });

  attachChatDomEvents({ dom, socket, mqMobile, store, ui, searchState, signal });
  const detachSocket = attachChatSocketHandlers({ socket, dom, userId, store, ui, searchState });

  ui.updateEmptyState();

  function destroy() {
    controller.abort();
    detachSocket();
  }

  return { destroy };
}