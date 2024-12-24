import type { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "~/lib/prisma.server";
let wss: WebSocketServer;

export function initWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());

      if (data.type === "queue:join") {
        // Broadcast queue update to all clients
        broadcastQueueUpdate();
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

export async function broadcastQueueUpdate() {
  wss = wss || new WebSocketServer({ noServer: true });
  if (!wss) {
    console.warn("WebSocket server not initialized");
    return;
  }
  try {
    const queue = await prisma.queue.findFirst({
      where: { status: "waiting" },
      include: { players: true },
    });

    const message = JSON.stringify({
      type: "queue:update",
      queue,
    });

    wss.clients.forEach((client) => {
      console.log(client);
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (error) {
    console.error("Broadcast queue update error:", error);
    throw new Error();
  }
}
