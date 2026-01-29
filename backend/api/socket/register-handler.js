import crypto from "node:crypto";

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("Missing userId in handshake.auth"));
    socket.data.userId = String(userId);
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    socket.on("dm:send", (payload, ack) => {
      const to = String(payload?.to ?? "");
      const text = String(payload?.text ?? "");

      if (!to) return ack?.({ ok: false, error: "Missing 'to'" });

      const msg = {
        id: crypto.randomUUID(),
        from: userId,
        to,
        text,
        createdAt: new Date().toISOString(),
      };

      io.to(`user:${to}`).emit("dm:receive", msg);
      socket.emit("dm:receive", msg);

      ack?.({ ok: true, msgId: msg.id });
    });
  });
}