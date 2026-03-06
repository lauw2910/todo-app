import { useState, useEffect, useRef } from "react";

export default function Messages({ token, userId, initialUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchConversations() {
    const res = await fetch("/api/messages", { headers });
    const data = await res.json();
    setConversations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchMessages(user) {
    setSelectedUser(user);
    const res = await fetch(`/api/messages/${user.other_user}`, { headers });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser) return;
    await fetch(`/api/messages/${selectedUser.other_user}`, {
      method: "POST", headers,
      body: JSON.stringify({ contenu: newMessage }),
    });
    setNewMessage("");
    fetchMessages(selectedUser);
    fetchConversations();
  }

  useEffect(() => {
    fetchConversations();
    if (initialUser) {
      fetchMessages(initialUser);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => fetchMessages(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function formatTime(d) {
    return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(d) {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  }

  return (
    <div style={s.container} className="fade-in">
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Messagerie</h1>
        <p style={s.pageDesc}>Échange avec tes partenaires sportifs</p>
      </div>

      <div style={s.chatLayout}>
        {/* Liste conversations */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <h3 style={s.sidebarTitle}>Conversations</h3>
            <span style={s.convCount}>{conversations.length}</span>
          </div>

          {loading && <p style={s.loadingText}>Chargement...</p>}

          {!loading && conversations.length === 0 && (
            <div style={s.emptyConv}>
              <span style={{ fontSize: "2rem" }}>💬</span>
              <p>Aucune conversation</p>
              <p style={s.emptyHint}>Va dans Joueurs et contacte quelqu'un !</p>
            </div>
          )}

          {conversations.map(conv => (
            <div key={conv.other_user}
              style={{...s.convItem, ...(selectedUser?.other_user === conv.other_user ? s.convItemActive : {})}}
              onClick={() => fetchMessages(conv)}>
              <div style={s.convAvatar}>
                {conv.prenom?.[0]?.toUpperCase()}{conv.nom?.[0]?.toUpperCase()}
              </div>
              <div style={s.convInfo}>
                <div style={s.convName}>{conv.prenom} {conv.nom}</div>
                <div style={s.convLast}>
                  {conv.dernier_message?.slice(0, 30)}...
                </div>
              </div>
              {parseInt(conv.non_lus) > 0 && (
                <div style={s.unreadBadge}>{conv.non_lus}</div>
              )}
            </div>
          ))}
        </div>

        {/* Fenêtre chat */}
        <div style={s.chatWindow}>
          {!selectedUser ? (
            <div style={s.noChat}>
              <span style={{ fontSize: "4rem" }}>💬</span>
              <h3 style={s.noChatTitle}>Sélectionne une conversation</h3>
              <p style={s.noChatDesc}>Ou va dans Joueurs pour démarrer une nouvelle discussion</p>
            </div>
          ) : (
            <>
              <div style={s.chatHeader}>
                <div style={s.chatAvatar}>
                  {selectedUser.prenom?.[0]?.toUpperCase()}
                  {selectedUser.nom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={s.chatName}>{selectedUser.prenom} {selectedUser.nom}</div>
                  <div style={s.chatStatus}>🟢 En ligne</div>
                </div>
              </div>

              <div style={s.messages}>
                {messages.map((msg, i) => {
                  const isMine = msg.expediteur_id === userId;
                  const showDate = i === 0 || formatDate(messages[i-1]?.created_at) !== formatDate(msg.created_at);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div style={s.dateSeparator}>{formatDate(msg.created_at)}</div>
                      )}
                      <div style={{...s.msgRow, ...(isMine ? s.msgRowMine : {})}}>
                        {!isMine && (
                          <div style={s.msgAvatar}>
                            {msg.prenom?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div style={{...s.bubble, ...(isMine ? s.bubbleMine : s.bubbleOther)}}>
                          <p style={s.bubbleText}>{msg.contenu}</p>
                          <span style={s.bubbleTime}>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef}/>
              </div>

              <div style={s.inputBar}>
                <input
                  style={s.msgInput}
                  placeholder="Écris un message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button style={s.sendBtn} onClick={sendMessage}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  pageHeader: { marginBottom: "1.5rem" },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  chatLayout: {
    display: "grid", gridTemplateColumns: "300px 1fr",
    height: "70vh", background: "var(--dark3)",
    borderRadius: "20px", overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  sidebar: {
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  sidebarHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  sidebarTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.1rem",
    fontWeight: "800", color: "white",
  },
  convCount: {
    background: "rgba(0,87,255,0.2)", color: "var(--cyan)",
    padding: "0.2rem 0.6rem", borderRadius: "20px",
    fontSize: "0.8rem", fontWeight: "700",
  },
  loadingText: { color: "var(--text2)", padding: "1rem", textAlign: "center" },
  emptyConv: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, padding: "2rem",
    color: "var(--text2)", textAlign: "center", gap: "0.5rem",
  },
  emptyHint: { fontSize: "0.8rem", color: "var(--text3)" },
  convItem: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "1rem 1.25rem", cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 0.2s",
  },
  convItemActive: { background: "rgba(0,87,255,0.15)" },
  convAvatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900",
    color: "white", fontSize: "1rem", flexShrink: 0,
  },
  convInfo: { flex: 1, overflow: "hidden" },
  convName: { color: "white", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.2rem" },
  convLast: { color: "var(--text2)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  unreadBadge: {
    background: "var(--blue)", color: "white",
    borderRadius: "50%", width: "20px", height: "20px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.7rem", fontWeight: "700", flexShrink: 0,
  },
  chatWindow: { display: "flex", flexDirection: "column", overflow: "hidden" },
  noChat: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, gap: "1rem", textAlign: "center",
  },
  noChatTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "800", color: "white",
  },
  noChatDesc: { color: "var(--text2)", fontSize: "0.9rem" },
  chatHeader: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark4)",
  },
  chatAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
  },
  chatName: { color: "white", fontWeight: "700", fontSize: "0.95rem" },
  chatStatus: { color: "var(--success)", fontSize: "0.75rem" },
  messages: {
    flex: 1, overflowY: "auto", padding: "1.25rem",
    display: "flex", flexDirection: "column", gap: "0.5rem",
  },
  dateSeparator: {
    textAlign: "center", color: "var(--text2)", fontSize: "0.75rem",
    padding: "0.5rem 0", fontWeight: "600",
  },
  msgRow: { display: "flex", gap: "0.5rem", alignItems: "flex-end" },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    background: "var(--dark4)", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "0.75rem", color: "var(--text2)",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "65%", padding: "0.75rem 1rem",
    borderRadius: "16px", position: "relative",
  },
  bubbleOther: { background: "var(--dark4)", borderBottomLeftRadius: "4px" },
  bubbleMine: {
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    borderBottomRightRadius: "4px",
  },
  bubbleText: { color: "white", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "0.25rem" },
  bubbleTime: { color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" },
  inputBar: {
    display: "flex", gap: "0.75rem", padding: "1rem 1.25rem",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark4)",
  },
  msgInput: {
    flex: 1, padding: "0.85rem 1rem",
    background: "var(--dark3)", border: "2px solid transparent",
    borderRadius: "12px", color: "white", fontSize: "0.9rem", outline: "none",
  },
  sendBtn: {
    width: "48px", height: "48px", borderRadius: "12px",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", cursor: "pointer",
    fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
  },
};
