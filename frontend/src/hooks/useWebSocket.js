import { useEffect, useRef, useCallback, useState } from "react";

export function useWebSocket(token, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  const tokenRef = useRef(token);
  const [connected, setConnected] = useState(false);

  onMessageRef.current = onMessage;
  tokenRef.current = token;

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    function cleanup() {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.onopen = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    function connect() {
      cleanup();
      if (cancelled) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log("[WS] Connexion à", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        console.log("[WS] Connecté !");
        ws.send(JSON.stringify({ type: "auth", token: tokenRef.current }));
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;
          if (data.type === "auth_ok") {
            console.log("[WS] Authentifié !");
            setConnected(true);
            return;
          }
          if (data.type === "auth_error") {
            console.error("[WS] Erreur auth");
            setConnected(false);
            return;
          }
          onMessageRef.current(data);
        } catch (err) {
          console.error("[WS] Erreur parsing:", err);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        console.log("[WS] Déconnecté, reconnexion dans 3s...");
        clearInterval(pingTimer.current);
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Erreur:", err);
      };
    }

    connect();

    return () => {
      cancelled = true;
      cleanup();
      setConnected(false);
    };
  }, [token]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    console.warn("[WS] Non connecté, message non envoyé");
    return false;
  }, []);

  return { sendMessage, connected };
}
