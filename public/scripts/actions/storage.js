export function createChatStore() {
  const conversations = new Map();
  const connectedPeers = new Set();
  let activePeerId = null;

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

  return {
    conversations,
    connectedPeers,
    get activePeerId() { return activePeerId; },
    set activePeerId(v) { activePeerId = v; },
    ensureConversation,
  };
}
