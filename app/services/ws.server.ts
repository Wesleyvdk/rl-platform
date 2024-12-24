import type { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { prisma } from "~/lib/prisma.server";

let wss: WebSocketServer;

export function initWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({ server: httpServer });

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
  const queue = await prisma.queue.findFirst({
    where: { status: "waiting" },
    include: { players: true },
  });

  const message = JSON.stringify({
    type: "queue:update",
    queue,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
