import { createServer } from "./api/server/create-server.js";

const { httpServer } = createServer();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});