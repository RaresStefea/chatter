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