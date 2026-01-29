export function getSessionFromPrompts() {
  const userId = prompt("Your userId (e.g. alice):")?.trim();
  const peerId = prompt("Send to userId (e.g. bob):")?.trim();

  if (!userId || !peerId) {
    alert("userId and peerId are required.");
    throw new Error("Missing userId/peerId");
  }

  return { userId, peerId };
}
