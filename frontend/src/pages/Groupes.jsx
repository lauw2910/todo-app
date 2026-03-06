import { useState, useEffect, useRef } from "react";

export default function Groupes({ token, userId }) {
  const [groupes, setGroupes] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState("tous");
  const [showCreate, setShowCreate] = useState(false);
  const [groupeActif, setGroupeActif] = useState(null);
  const [membres, setMembres] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({ nom: "", description: "", sport_id: "", ville: "", prive: false });
  const [toast, setToast] = useState("");
  const messagesEndRef = useRef(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function fetchGroupes() {
    const res = await fetch("/api/groupes", { headers });
    const data = await res.json();
    setGroupes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchSports() {
    const res = await fetch("/api/profil/sports", { headers });
    const data = await res.json();
    setSports(data);
  }

  async function fetchMembres(id) {
    const res = await fetch(`/api/groupes/${id}/membres`, { headers });
    const data = await res.json();
    setMembres(Array.isArray(data) ? data : []);
  }

  async function fetchMessages(id) {
    const res = await fetch(`/api/groupes/${id}/messages`, { headers });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  useEffect(() => {
    fetchGroupes();
    fetchSports();
  }, []);

  useEffect(() => {
    if (!groupeActif) return;
    fetchMessages(groupeActif.id);
    fetchMembres(groupeActif.id);
    const interval = setInterval(() => fetchMessages(groupeActif.id), 3000);
    return () => clearInterval(interval);
  }, [groupeActif]);

  async function creerGroupe() {
    if (!form.nom || !form.sport_id) { showToast("Nom et sport requis"); return; }
    const res = await fetch("/api/groupes", { method: "POST", headers, body: JSON.stringify(form) });
    if (res.ok) {
      showToast("✅ Groupe créé !");
      setShowCreate(false);
      setForm({ nom: "", description: "", sport_id: "", ville: "", prive: false });
      fetchGroupes();
    }
  }

  async function rejoindre(id) {
    await fetch(`/api/groupes/${id}/rejoindre`, { method: "POST", headers });
    showToast("✅ Groupe rejoint !");
    fetchGroupes();
  }

  async function quitter(id) {
    await fetch(`/api/groupes/${id}/quitter`, { method: "DELETE", headers });
    showToast("Groupe quitté");
    fetchGroupes();
    if (groupeActif?.id === id) setGroupeActif(null);
  }

  async function envoyerMessage() {
    if (!newMessage.trim()) return;
    await fetch(`/api/groupes/${groupeActif.id}/messages`, {
      method: "POST", headers, body: JSON.stringify({ contenu: newMessage }),
    });
    setNewMessage("");
    fetchMessages(groupeActif.id);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function formatDate(d) {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  const groupesFiltres = groupes.filter(g => {
    if (onglet === "mes") return g.est_membre;
    return true;
  });

  if (groupeActif) {
    const estMembre = groupeActif.est_membre;
    return (
      <div style={s.container} className="fade-in">
        <div style={s.chatLayout}>
          {/* Sidebar membres */}
          <div style={s.membersSidebar}>
            <button style={s.backBtn} onClick={() => setGroupeActif(null)}>← Retour</button>
            <div style={s.groupeInfo}>
              <div style={s.groupeIconBig}>{groupeActif.sport_icone}</div>
              <h3 style={s.groupeNomBig}>{groupeActif.nom}</h3>
              <p style={s.groupeVille}>📍 {groupeActif.ville || "Partout"}</p>
              {groupeActif.description && <p style={s.groupeDesc}>{groupeActif.description}</p>}
            </div>
            <div style={s.membresTitle}>👥 {membres.length} membre{membres.length > 1 ? "s" : ""}</div>
            <div style={s.membresList}>
              {membres.map(m => (
                <div key={m.id} style={s.membreItem}>
                  <div style={s.membreAvatar}>
                    {m.photo
                      ? <img src={m.photo} style={s.membreAvatarImg} alt="" />
                      : `${m.prenom?.[0]}${m.nom?.[0]}`
                    }
                  </div>
                  <div>
                    <div style={s.membreNom}>{m.prenom} {m.nom}</div>
                    {m.role === "admin" && <span style={s.adminBadge}>👑 Admin</span>}
                  </div>
                </div>
              ))}
            </div>
            {estMembre && (
              <button style={s.quitterBtn} onClick={() => quitter(groupeActif.id)}>
                Quitter le groupe
              </button>
            )}
          </div>

          {/* Chat */}
          <div style={s.chatMain}>
            <div style={s.chatHeader}>
              <span style={s.chatTitle}>💬 Chat — {groupeActif.nom}</span>
            </div>
            <div style={s.chatMessages}>
              {messages.length === 0 && (
                <div style={s.chatEmpty}>Soyez le premier à écrire un message !</div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.user_id === userId;
                const showDate = i === 0 || formatDate(messages[i-1].created_at) !== formatDate(msg.created_at);
                return (
                  <div key={msg.id}>
                    {showDate && <div style={s.dateSep}>{formatDate(msg.created_at)}</div>}
                    <div style={{...s.msgRow, ...(isMine ? s.msgRowMine : {})}}>
                      {!isMine && (
                        <div style={s.msgAvatar}>
                          {msg.photo
                            ? <img src={msg.photo} style={s.msgAvatarImg} alt="" />
                            : `${msg.prenom?.[0]}${msg.nom?.[0]}`
                          }
                        </div>
                      )}
                      <div style={{...s.msgBubble, ...(isMine ? s.msgBubbleMine : {})}}>
                        {!isMine && <div style={s.msgAuthor}>{msg.prenom} {msg.nom}</div>}
                        <p style={s.msgText}>{msg.contenu}</p>
                        <span style={s.msgTime}>{new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </div>
            {estMembre ? (
              <div style={s.chatInput}>
                <input style={s.chatInputField}
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && envoyerMessage()} />
                <button style={s.chatSendBtn} onClick={envoyerMessage}>➤</button>
              </div>
            ) : (
              <div style={s.joinPrompt}>
                <button style={s.joinBtn} onClick={() => rejoindre(groupeActif.id)}>
                  👥 Rejoindre pour participer au chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container} className="fade-in">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Groupes sportifs</h1>
          <p style={s.pageDesc}>Rejoins des équipes et échange avec des sportifs</p>
        </div>
        <button style={s.createBtn} onClick={() => setShowCreate(true)}>
          + Créer un groupe
        </button>
      </div>

      {/* Modal créer */}
      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()} className="fade-in">
            <h3 style={s.modalTitle}>👥 Créer un groupe</h3>
            <div style={s.field}>
              <label style={s.label}>Nom du groupe *</label>
              <input style={s.input} placeholder="Ex: Padel Sunday Club"
                value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Sport *</label>
              <select style={s.input} value={form.sport_id}
                onChange={e => setForm({...form, sport_id: e.target.value})}>
                <option value="">Choisir un sport</option>
                {sports.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.icone} {sp.nom}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Ville</label>
              <input style={s.input} placeholder="Ex: Paris"
                value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{...s.input, height: "80px", resize: "vertical"}}
                placeholder="Décris ton groupe..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={s.checkRow}>
              <input type="checkbox" id="prive" checked={form.prive}
                onChange={e => setForm({...form, prive: e.target.checked})} />
              <label htmlFor="prive" style={s.checkLabel}>🔒 Groupe privé</label>
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setShowCreate(false)}>Annuler</button>
              <button style={s.submitBtn} onClick={creerGroupe}>✓ Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div style={s.tabs}>
        <button style={{...s.tab, ...(onglet === "tous" ? s.tabActive : {})}}
          onClick={() => setOnglet("tous")}>
          🌍 Tous les groupes
          <span style={s.tabBadge}>{groupes.length}</span>
        </button>
        <button style={{...s.tab, ...(onglet === "mes" ? s.tabActive : {})}}
          onClick={() => setOnglet("mes")}>
          👤 Mes groupes
          <span style={s.tabBadge}>{groupes.filter(g => g.est_membre).length}</span>
        </button>
      </div>

      {loading ? (
        <div style={s.loading}><div style={s.spinner}/></div>
      ) : groupesFiltres.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>👥</span>
          <h3 style={s.emptyTitle}>
            {onglet === "mes" ? "Tu n'as rejoint aucun groupe" : "Aucun groupe disponible"}
          </h3>
          <p style={s.emptySub}>Crée le premier groupe !</p>
        </div>
      ) : (
        <div style={s.grid}>
          {groupesFiltres.map(groupe => (
            <div key={groupe.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.sportIcon}>{groupe.sport_icone}</div>
                <div style={s.cardBadges}>
                  {groupe.prive && <span style={s.priveBadge}>🔒 Privé</span>}
                  {groupe.est_membre && <span style={s.membreBadge}>✓ Membre</span>}
                </div>
              </div>
              <h3 style={s.cardNom}>{groupe.nom}</h3>
              <div style={s.cardInfos}>
                <span style={s.cardInfo}>🏅 {groupe.sport_nom}</span>
                {groupe.ville && <span style={s.cardInfo}>📍 {groupe.ville}</span>}
                <span style={s.cardInfo}>👥 {groupe.nb_membres} membre{groupe.nb_membres > 1 ? "s" : ""}</span>
              </div>
              {groupe.description && <p style={s.cardDesc}>{groupe.description}</p>}
              <p style={s.cardCreateur}>Créé par {groupe.createur}</p>
              <div style={s.cardBtns}>
                <button style={s.chatBtn} onClick={() => setGroupeActif(groupe)}>
                  💬 Chat
                </button>
                {groupe.est_membre ? (
                  <button style={s.quitterCardBtn} onClick={() => quitter(groupe.id)}>
                    Quitter
                  </button>
                ) : (
                  <button style={s.rejoindreBtn} onClick={() => rejoindre(groupe.id)}>
                    + Rejoindre
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  toast: {
    position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
    background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem 1.5rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  createBtn: {
    padding: "0.85rem 1.5rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "0.95rem",
  },
  tabs: {
    display: "flex", gap: "0.5rem", marginBottom: "2rem",
    background: "var(--dark3)", borderRadius: "12px", padding: "4px",
    width: "fit-content",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.6rem 1.25rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s",
  },
  tabActive: { background: "var(--blue)", color: "white" },
  tabBadge: {
    background: "rgba(255,255,255,0.2)", color: "white",
    borderRadius: "20px", padding: "0.1rem 0.5rem",
    fontSize: "0.75rem", fontWeight: "700",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--dark3)", borderRadius: "20px", padding: "2rem",
    width: "460px", border: "1px solid rgba(0,87,255,0.3)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  modalTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "white", marginBottom: "1.5rem",
  },
  field: { marginBottom: "1rem" },
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
  },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
  },
  checkRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" },
  checkLabel: { color: "var(--text2)", fontSize: "0.9rem", cursor: "pointer" },
  modalBtns: { display: "flex", gap: "0.75rem" },
  cancelBtn: {
    flex: 1, padding: "0.85rem", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontWeight: "600",
  },
  submitBtn: {
    flex: 1, padding: "0.85rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "10px",
    fontWeight: "700", cursor: "pointer",
  },
  loading: { display: "flex", justifyContent: "center", padding: "4rem" },
  spinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
  },
  empty: { textAlign: "center", padding: "5rem 0" },
  emptyIcon: { fontSize: "4rem", display: "block", marginBottom: "1rem" },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  emptySub: { color: "var(--text2)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  sportIcon: { fontSize: "2.5rem" },
  cardBadges: { display: "flex", gap: "0.4rem" },
  priveBadge: {
    background: "rgba(255,179,0,0.1)", color: "#FFB300",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  membreBadge: {
    background: "rgba(0,230,118,0.1)", color: "#00E676",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  cardNom: {
    fontFamily: "var(--font-display)", fontSize: "1.3rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  cardInfos: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" },
  cardInfo: { color: "var(--text2)", fontSize: "0.82rem" },
  cardDesc: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "0.5rem" },
  cardCreateur: { color: "var(--text2)", fontSize: "0.78rem", marginBottom: "1rem" },
  cardBtns: { display: "flex", gap: "0.5rem" },
  chatBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "10px", color: "var(--cyan)", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  rejoindreBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    borderRadius: "10px", color: "#00E676", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  quitterCardBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    borderRadius: "10px", color: "#FF3D57", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },

  // Chat layout
  chatLayout: { display: "flex", gap: "1.5rem", height: "calc(100vh - 120px)" },
  membersSidebar: {
    width: "260px", background: "var(--dark3)", borderRadius: "16px",
    padding: "1.25rem", border: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto",
  },
  backBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text2)", padding: "0.5rem 1rem", borderRadius: "8px",
    cursor: "pointer", fontWeight: "600", fontSize: "0.85rem",
  },
  groupeInfo: { textAlign: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  groupeIconBig: { fontSize: "3rem", marginBottom: "0.5rem" },
  groupeNomBig: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: "800", color: "white", marginBottom: "0.25rem",
  },
  groupeVille: { color: "var(--text2)", fontSize: "0.85rem" },
  groupeDesc: { color: "var(--text2)", fontSize: "0.8rem", marginTop: "0.5rem", lineHeight: "1.5" },
  membresTitle: { color: "var(--text2)", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" },
  membresList: { display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 },
  membreItem: { display: "flex", alignItems: "center", gap: "0.75rem" },
  membreAvatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.8rem", fontWeight: "900", color: "white", flexShrink: 0, overflow: "hidden",
  },
  membreAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  membreNom: { color: "white", fontSize: "0.85rem", fontWeight: "600" },
  adminBadge: {
    background: "rgba(255,179,0,0.1)", color: "#FFB300",
    padding: "0.1rem 0.5rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700",
  },
  quitterBtn: {
    padding: "0.65rem", background: "rgba(255,61,87,0.1)",
    border: "1px solid rgba(255,61,87,0.3)", borderRadius: "10px",
    color: "#FF3D57", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem",
  },
  chatMain: {
    flex: 1, background: "var(--dark3)", borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  chatHeader: {
    padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark4)",
  },
  chatTitle: { color: "white", fontWeight: "700", fontSize: "1rem" },
  chatMessages: { flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  chatEmpty: { textAlign: "center", color: "var(--text2)", padding: "3rem", fontSize: "0.9rem" },
  dateSep: {
    textAlign: "center", color: "var(--text2)", fontSize: "0.75rem",
    margin: "0.5rem 0", padding: "0.25rem 1rem",
    background: "var(--dark4)", borderRadius: "20px", alignSelf: "center",
  },
  msgRow: { display: "flex", gap: "0.5rem", alignItems: "flex-end" },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", fontWeight: "900", color: "white", flexShrink: 0, overflow: "hidden",
  },
  msgAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  msgBubble: {
    maxWidth: "70%", background: "var(--dark4)", borderRadius: "16px 16px 16px 4px",
    padding: "0.6rem 1rem",
  },
  msgBubbleMine: {
    background: "rgba(0,87,255,0.3)", borderRadius: "16px 16px 4px 16px",
  },
  msgAuthor: { color: "var(--cyan)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.25rem" },
  msgText: { color: "white", fontSize: "0.9rem", lineHeight: "1.5" },
  msgTime: { color: "var(--text2)", fontSize: "0.7rem", display: "block", marginTop: "0.25rem" },
  chatInput: {
    display: "flex", gap: "0.5rem", padding: "1rem",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  chatInputField: {
    flex: 1, padding: "0.85rem 1rem", background: "var(--dark4)",
    border: "2px solid transparent", borderRadius: "12px",
    color: "white", fontSize: "0.9rem", outline: "none",
  },
  chatSendBtn: {
    padding: "0.85rem 1.25rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "1rem",
  },
  joinPrompt: { padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" },
  joinBtn: {
    width: "100%", padding: "0.85rem",
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    borderRadius: "12px", color: "#00E676", fontWeight: "700", cursor: "pointer",
  },
};
