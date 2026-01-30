import { promptForFriendIdModal } from "../actions/auth.js";
import { runUserNameSearch } from "../actions/search.js";

export function attachChatDomEvents({ dom, socket, mqMobile, store, ui, searchState, signal }) {
  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener("click", () => {
      if (!mqMobile.matches) return;
      ui.setMobileView("sidebar");
    }, { signal });
  }

  dom.addUserBtn.addEventListener("click", async () => {
    const res = await promptForFriendIdModal();
    if (!res) return;

    store.ensureConversation(res.peerId);

    socket.emit("connect:request", { peerId: res.peerId }, (ack) => {
      if (!ack?.ok) console.error("connect:request failed:", ack);
    });
  }, { signal });

  dom.conversationsList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const item = btn.closest(".message-item");
    const peerId = item?.dataset.peerId;
    if (!peerId) return;

    if (btn.classList.contains("hide-wrapper")) {
      store.connectedPeers.add(peerId);
      ui.openConversation(peerId);
      return;
    }

    if (btn.classList.contains("delete-wrapper")) {
      socket.emit("connect:delete", { peerId }, (ack) => {
        if (!ack?.ok) console.error("connect:delete failed:", ack);
      });
    }
  }, { signal });

  function sendMessage() {
    const text = dom.input.value.trim();
    if (!text || !store.activePeerId) return;

    socket.emit("dm:send", { to: store.activePeerId, text }, (ack) => {
      if (!ack?.ok) console.error("Send failed:", ack);
    });

    dom.input.value = "";
    dom.input.focus();
  }

  dom.sendBtn.addEventListener("click", sendMessage, { signal });

  dom.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  }, { signal });

  dom.searchInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const q = dom.searchInput.value.trim();
    runUserNameSearch(dom.conversationsList, q, searchState);
  }, { signal });
}