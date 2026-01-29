export function getChatDom() {
  const list = document.querySelector(".sent-messages-wrapper");
  const input = document.querySelector(".message-input-wrapper input");
  const sendBtn = document.querySelector(".send-wrapper");

  const conversationsList = document.querySelector(".message-wrapper");
  const addUserBtn = document.querySelector(".add-wrapper");

  const header = document.querySelector(".convo-information");
  const peerName = document.querySelector(".person-name h3");
  const composer = document.querySelector(".message-bar-wrapper");

  if (!list || !input || !sendBtn) throw new Error("Message DOM elements not found.");
  if (!conversationsList || !addUserBtn) throw new Error("Left panel DOM elements not found.");
  if (!header || !peerName || !composer) throw new Error("Right panel DOM elements not found.");

  return { list, input, sendBtn, conversationsList, addUserBtn, header, peerName, composer };
}