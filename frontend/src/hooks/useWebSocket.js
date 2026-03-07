import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(token, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log("[WS] Connexion à", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connecté !");

      // Authentification
      ws.send(JSON.stringify({ type: "auth", token }));

      // Ping toutes les 30s pour garder la connexion ouverte
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") return;
        if (data.type === "auth_ok") {
          console.log("[WS] Authentifié !");
          return;
        }
        if (data.type === "auth_error") {
          console.error("[WS] Erreur auth");
          return;
        }
        onMessage(data);
      } catch (err) {
        console.error("[WS] Erreur parsing:", err);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Déconnecté, reconnexion dans 3s...");
      clearInterval(pingTimer.current);
      // Reconnexion automatique
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("[WS] Erreur:", err);
      ws.close();
    };
  }, [token, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Évite la reconnexion au démontage
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    console.warn("[WS] Non connecté, message non envoyé");
    return false;
  }, []);

  return { sendMessage };
}
