// Sample test to check server and whether it exists and works

import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";

function withTimeout(promise, ms, label = "operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    )
  ]);
}

test("Socket server can deliver DM from one userId to another (standalone)", async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_, res) => res.json({ ok: true }));

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: true }
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("Missing userId in handshake.auth"));
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.on("dm:send", (payload, ack) => {
      const msg = {
        id: crypto.randomUUID(),
        from: userId,
        to: payload.to,
        text: String(payload.text ?? ""),
        createdAt: new Date().toISOString()
      };

      io.to(`user:${msg.to}`).emit("dm:receive", msg);

      socket.emit("dm:receive", msg);

      ack?.({ ok: true, msgId: msg.id });
    });
  });

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const URL = `http://localhost:${port}`;

  const alice = ioClient(URL, { auth: { userId: "alice" } });
  const bob = ioClient(URL, { auth: { userId: "bob" } });

  const connectErrors = [];
  alice.on("connect_error", (e) => connectErrors.push(["alice", e.message]));
  bob.on("connect_error", (e) => connectErrors.push(["bob", e.message]));

  await withTimeout(
    Promise.all([
      new Promise((res) => alice.on("connect", res)),
      new Promise((res) => bob.on("connect", res))
    ]),
    3000,
    "clients connect"
  );

  const expectedText = "Hello Bob";

  const bobReceived = withTimeout(
    new Promise((resolve) => {
      bob.on("dm:receive", (msg) => resolve(msg));
    }),
    3000,
    "Bob receive message"
  );

  const ackResult = await withTimeout(
    new Promise((resolve) => {
      alice.emit("dm:send", { to: "bob", text: expectedText }, (ack) => resolve(ack));
    }),
    3000,
    "Alice ACK"
  );

  assert.equal(ackResult?.ok, true, "Expected ok:true ACK from server");
  assert.ok(ackResult?.msgId, "Expected msgId in ACK");

  const msg = await bobReceived;
  assert.equal(msg.from, "alice");
  assert.equal(msg.to, "bob");
  assert.equal(msg.text, expectedText);
  assert.ok(msg.id, "Message should have server-generated id");
  assert.ok(msg.createdAt, "Message should have createdAt timestamp");

  assert.equal(connectErrors.length, 0, `Connect errors occurred: ${JSON.stringify(connectErrors)}`);

  alice.disconnect();
  bob.disconnect();
  io.close();
  httpServer.close();
});
