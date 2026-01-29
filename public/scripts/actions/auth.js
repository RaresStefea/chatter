export function getUserIdFromPrompt() {
  const userId = prompt("Your name / userId:")?.trim();
  if (!userId) {
    alert("Your name is required.");
    throw new Error("Missing userId");
  }
  return { userId };
}

export function promptForFriendId() {
  const peerId = prompt("Friend's userId:")?.trim();
  if (!peerId) return null;
  return { peerId };
}
