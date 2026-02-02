import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";

import { registerSocketHandlers } from "../socket/register-handler.js";

export function createServer() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.use(express.static("public"));

  app.get("/health", (_, res) => res.json({ ok: true }));

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  registerSocketHandlers(io);

  return { app, io, httpServer };
}