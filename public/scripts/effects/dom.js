export function getChatDom() {
  const list = document.querySelector(".sent-messages-wrapper");
  const input = document.querySelector(".message-input-wrapper input"); 
  const sendBtn = document.querySelector(".send-wrapper"); 
  if (!list || !input || !sendBtn) {
    throw new Error("Chat DOM elements not found. Check your HTML selectors.");
  }

  return { list, input, sendBtn };
}
