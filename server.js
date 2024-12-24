import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { WebSocketServer } from "ws";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();
app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client")
);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all("*", (req, res, next) => {
  if (req.headers.upgrade === "websocket") {
    // Ignore WebSocket requests
    return next();
  }
  createRequestHandler({ build })(req, res, next);
});
const server = app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});

const wss = new WebSocketServer({ server });

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("WebSocket connection established!");

  // Handle incoming messages
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Handle WebSocket close event
  ws.on("close", (code, reason) => {
    console.log(
      `WebSocket connection closed! Code: ${code}, Reason: ${reason}`
    );
  });
});
