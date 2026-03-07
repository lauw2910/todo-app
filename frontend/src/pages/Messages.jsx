import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Messages({ token, userId, initialUser }) {
  const [conversations, setConversations] = useState([]);
  const [convActuelle, setConvActuelle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleWsMessage = useCallback((data) => {
    if (data.type === "message") {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setConversations(prev => prev.map(c => {
        if (c.other_user === data.expediteur_id || c.other_user === data.destinataire_id) {
          return { ...c, dernier_message: data.contenu };
        }
        return c;
      }));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const { sendMessage: wsSend, connected: wsConnected } = useWebSocket(token, handleWsMessage);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialUser && conversations.length >= 0) {
      setConvActuelle(initialUser);
    }
  }, [initialUser, conversations]);

  useEffect(() => {
    if (!convActuelle) return;
    fetchMessages(convActuelle.other_user);
  }, [convActuelle]);

  async function fetchConversations() {
    const res = await fetch("/api/messages", { headers });
    const data = await res.json();
    setConversations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchMessages(otherId) {
    const res = await fetch(`/api/messages/${otherId}`, { headers });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    const contenu = newMessage.trim();
    setNewMessage("");

    const sent = wsSend({
      type: "message",
      destinataire_id: convActuelle.other_user,
      contenu,
    });

    if (!sent) {
      await fetch(`/api/messages/${convActuelle.other_user}`, {
        method: "POST", headers, body: JSON.stringify({ contenu }),
      });
      fetchMessages(convActuelle.other_user);
    }

    fetchConversations();
  }

  function formatTime(d) {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  if (convActuelle) {
    return (
      <div style={isMobile ? s.chatPageMobile : s.chatPage}>
        <div style={s.chatHeader}>
          <button style={s.backBtn} onClick={() => { setConvActuelle(null); fetchConversations(); }}>←</button>
          <div style={s.chatHeaderAvatar}>
            {convActuelle.photo
              ? <img src={convActuelle.photo} style={s.headerAvatarImg} alt="" />
              : `${convActuelle.prenom?.[0]}${convActuelle.nom?.[0]}`
            }
          </div>
          <div>
            <div style={s.chatHeaderNom}>{convActuelle.prenom} {convActuelle.nom}</div>
            <div style={s.chatHeaderSub}>
              <span style={{
                display: "inline-block", width: "8px", height: "8px",
                borderRadius: "50%", background: wsConnected ? "#00E676" : "#FFB300",
                marginRight: "0.4rem",
              }}/>
              {wsConnected ? "Temps réel" : "Connexion..."}
            </div>
          </div>
        </div>

        <div style={s.chatMessages}>
          {messages.length === 0 && (
            <div style={s.chatEmpty}>
              <span style={s.chatEmptyIcon}>💬</span>
              <p>Commencez la conversation !</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = msg.expediteur_id === userId;
            const showTime = i === 0 || formatTime(messages[i-1].created_at) !== formatTime(msg.created_at);
            return (
              <div key={msg.id}>
                {showTime && <div style={s.timeSep}>{formatTime(msg.created_at)}</div>}
                <div style={{...s.msgRow, ...(isMine ? s.msgRowMine : {})}}>
                  {!isMine && (
                    <div style={s.msgAvatar}>
                      {convActuelle.photo
                        ? <img src={convActuelle.photo} style={s.msgAvatarImg} alt="" />
                        : `${convActuelle.prenom?.[0]}${convActuelle.nom?.[0]}`
                      }
                    </div>
                  )}
                  <div style={{...s.msgBubble, ...(isMine ? s.msgBubbleMine : {})}}>
                    <p style={s.msgText}>{msg.contenu}</p>
                    <span style={s.msgTime}>
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef}/>
        </div>

        <div style={isMobile ? s.chatInputMobile : s.chatInput}>
          <input style={s.chatInputField}
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()} />
          <button style={s.sendBtn} onClick={sendMessage}>➤</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container} className="fade-in">
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Messages</h1>
          <p style={s.pageDesc}>Tes conversations avec d'autres sportifs</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.8rem", color: wsConnected ? "#00E676" : "#FFB300",
        }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: wsConnected ? "#00E676" : "#FFB300",
            display: "inline-block",
          }}/>
          {wsConnected ? "Temps réel" : "Connexion..."}
        </div>
      </div>

      {loading ? (
        <div style={s.loading}><div style={s.spinner}/></div>
      ) : conversations.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>💬</span>
          <h3 style={s.emptyTitle}>Aucune conversation</h3>
          <p style={s.emptySub}>Contacte un joueur depuis la recherche !</p>
        </div>
      ) : (
        <div style={s.convList}>
          {conversations.map(conv => (
            <div key={conv.other_user} style={s.convItem}
              onClick={() => setConvActuelle(conv)}>
              <div style={s.convAvatar}>
                {conv.photo
                  ? <img src={conv.photo} style={s.convAvatarImg} alt="" />
                  : `${conv.prenom?.[0]}${conv.nom?.[0]}`
                }
                {conv.non_lus > 0 && <div style={s.convBadge}>{conv.non_lus}</div>}
              </div>
              <div style={s.convInfo}>
                <div style={s.convNom}>{conv.prenom} {conv.nom}</div>
                <div style={s.convDernier}>{conv.dernier_message || "Nouvelle conversation"}</div>
              </div>
              <div style={s.convMeta}>
                <div style={s.convTime}>{formatTime(conv.created_at)}</div>
                {conv.non_lus > 0 && <div style={s.convUnread}>{conv.non_lus}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "700px", margin: "0 auto" },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "1.5rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  loading: { display: "flex", justifyContent: "center", padding: "4rem" },
  spinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
    animation: "spin 0.8s linear infinite",
  },
  empty: { textAlign: "center", padding: "5rem 0" },
  emptyIcon: { fontSize: "4rem", display: "block", marginBottom: "1rem" },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  emptySub: { color: "var(--text2)" },
  convList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  convItem: {
    display: "flex", alignItems: "center", gap: "1rem",
    background: "var(--dark3)", borderRadius: "14px", padding: "1rem 1.25rem",
    border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
  },
  convAvatar: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
    fontSize: "1rem", flexShrink: 0, position: "relative", overflow: "hidden",
  },
  convAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  convBadge: {
    position: "absolute", top: "-2px", right: "-2px",
    background: "#FF3D57", color: "white", borderRadius: "50%",
    width: "18px", height: "18px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "700",
  },
  convInfo: { flex: 1, minWidth: 0 },
  convNom: { color: "white", fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.2rem" },
  convDernier: {
    color: "var(--text2)", fontSize: "0.82rem",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  convMeta: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" },
  convTime: { color: "var(--text2)", fontSize: "0.75rem" },
  convUnread: {
    background: "var(--blue)", color: "white", borderRadius: "50%",
    width: "20px", height: "20px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "700",
  },
  chatPage: {
    display: "flex", flexDirection: "column",
    height: "calc(100vh - 60px)",
    maxWidth: "700px", margin: "0 auto",
  },
  chatPageMobile: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 200, background: "var(--dark)",
    display: "flex", flexDirection: "column",
  },
  chatHeader: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "1rem 1.25rem",
    background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  backBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "white", width: "36px", height: "36px", borderRadius: "50%",
    cursor: "pointer", fontSize: "1rem", display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  chatHeaderAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
    fontSize: "0.9rem", flexShrink: 0, overflow: "hidden",
  },
  headerAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  chatHeaderNom: { color: "white", fontWeight: "700", fontSize: "0.95rem" },
  chatHeaderSub: { color: "var(--text2)", fontSize: "0.75rem", display: "flex", alignItems: "center" },
  chatMessages: {
    flex: 1, overflowY: "auto", padding: "1rem",
    display: "flex", flexDirection: "column", gap: "0.5rem",
    minHeight: 0,
  },
  chatEmpty: { textAlign: "center", padding: "3rem 0", color: "var(--text2)" },
  chatEmptyIcon: { fontSize: "3rem", display: "block", marginBottom: "0.5rem" },
  timeSep: {
    textAlign: "center", color: "var(--text2)", fontSize: "0.75rem",
    margin: "0.5rem 0", alignSelf: "center",
    background: "var(--dark3)", padding: "0.2rem 0.75rem", borderRadius: "20px",
  },
  msgRow: { display: "flex", gap: "0.5rem", alignItems: "flex-end" },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: "30px", height: "30px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.7rem", fontWeight: "900", color: "white",
    flexShrink: 0, overflow: "hidden",
  },
  msgAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  msgBubble: {
    maxWidth: "70%", background: "var(--dark3)",
    borderRadius: "16px 16px 16px 4px", padding: "0.6rem 1rem",
  },
  msgBubbleMine: {
    background: "rgba(0,87,255,0.3)",
    borderRadius: "16px 16px 4px 16px",
  },
  msgText: { color: "white", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 },
  msgTime: { color: "var(--text2)", fontSize: "0.7rem", display: "block", marginTop: "0.25rem" },
  chatInput: {
    display: "flex", gap: "0.5rem", padding: "1rem",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark2)", flexShrink: 0,
  },
  chatInputMobile: {
    display: "flex", gap: "0.5rem",
    padding: "0.75rem 1rem",
    paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark2)", flexShrink: 0,
  },
  chatInputField: {
    flex: 1, padding: "0.85rem 1rem", background: "var(--dark4)",
    border: "2px solid transparent", borderRadius: "12px",
    color: "white", fontSize: "16px", outline: "none",
  },
  sendBtn: {
    padding: "0.85rem 1.25rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "1rem",
  },
};
