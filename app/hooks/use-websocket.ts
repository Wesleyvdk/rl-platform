import { useEffect, useRef, useCallback } from "react";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
      window.location.host
    }/ws`;
    console.log("Connecting to WebSocket at:", wsUrl);

    const connect = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("Connected to WebSocket");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed. Attempting to reconnect...");
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected, message not sent:", message);
    }
  }, []);

  return { sendMessage };
}
