import crypto from "node:crypto";

const pending = new Map();

const connections = new Map();

function ensureSet(map, key) {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
}

function isConnected(a, b) {
  return connections.get(a)?.has(b) === true;
}

function addConnection(a, b) {
  ensureSet(connections, a).add(b);
  ensureSet(connections, b).add(a);
}

function removeConnection(a, b) {
  connections.get(a)?.delete(b);
  connections.get(b)?.delete(a);
  pending.get(a)?.delete(b);
  pending.get(b)?.delete(a);
}

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

    socket.on("connect:request", ({ peerId }, ack) => {
      const to = String(peerId ?? "").trim();
      if (!to) return ack?.({ ok: false, error: "Missing 'peerId'" });
      if (to === userId) return ack?.({ ok: false, error: "Cannot connect to yourself" });

      if (isConnected(userId, to)) {
        io.to(`user:${userId}`).emit("connect:confirmed", { peerId: to });
        return ack?.({ ok: true, status: "already_connected" });
      }

      ensureSet(pending, userId).add(to);

      const mutual = pending.get(to)?.has(userId) === true;
      if (mutual) {
        addConnection(userId, to);

        io.to(`user:${userId}`).emit("connect:confirmed", { peerId: to });
        io.to(`user:${to}`).emit("connect:confirmed", { peerId: userId });

        pending.get(userId)?.delete(to);
        pending.get(to)?.delete(userId);

        return ack?.({ ok: true, status: "confirmed" });
      }

      return ack?.({ ok: true, status: "pending" });
    });

    socket.on("connect:delete", ({ peerId }, ack) => {
      const peer = String(peerId ?? "").trim();
      if (!peer) return ack?.({ ok: false, error: "Missing 'peerId'" });

      const existed = isConnected(userId, peer);
      removeConnection(userId, peer);

      io.to(`user:${userId}`).emit("connect:deleted", { peerId: peer });
      io.to(`user:${peer}`).emit("connect:deleted", { peerId: userId });

      return ack?.({ ok: true, existed });
    });

    socket.on("dm:send", (payload, ack) => {
      const to = String(payload?.to ?? "").trim();
      const text = String(payload?.text ?? "");
      if (!to) return ack?.({ ok: false, error: "Missing 'to'" });
      if (!isConnected(userId, to)) {
        return ack?.({ ok: false, error: "Not connected" });
      }

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