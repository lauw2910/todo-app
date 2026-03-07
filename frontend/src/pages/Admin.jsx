import { useState, useEffect } from "react";

export default function Admin({ token }) {
  const [onglet, setOnglet] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [evenementActif, setEvenementActif] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [toast, setToast] = useState("");
  const [logsFilter, setLogsFilter] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (onglet === "users") fetchUsers();
    if (onglet === "evenements") fetchEvenements();
    if (onglet === "groupes") fetchGroupes();
    if (onglet === "logs") fetchLogs();
  }, [onglet]);

  useEffect(() => {
    if (!evenementActif) return;
    fetchParticipants(evenementActif.id);
  }, [evenementActif]);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats", { headers });
    const data = await res.json();
    setStats(data);
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users", { headers });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function fetchEvenements() {
    const res = await fetch("/api/admin/evenements", { headers });
    const data = await res.json();
    setEvenements(Array.isArray(data) ? data : []);
  }

  async function fetchGroupes() {
    const res = await fetch("/api/admin/groupes", { headers });
    const data = await res.json();
    setGroupes(Array.isArray(data) ? data : []);
  }

  async function fetchLogs() {
    const res = await fetch("/api/rgpd/logs", { headers });
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
  }

  async function fetchParticipants(id) {
    const res = await fetch(`/api/admin/evenements/${id}/participants`, { headers });
    const data = await res.json();
    setParticipants(Array.isArray(data) ? data : []);
  }

  async function supprimerUser(id) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers });
    showToast("✅ Utilisateur supprimé");
    fetchUsers(); fetchStats();
  }

  async function changerRole(id, role) {
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT", headers, body: JSON.stringify({ role }),
    });
    showToast(`✅ Rôle mis à jour : ${role}`);
    fetchUsers();
  }

  async function supprimerEvenement(id) {
    if (!confirm("Supprimer cet événement ?")) return;
    await fetch(`/api/admin/evenements/${id}`, { method: "DELETE", headers });
    showToast("✅ Événement supprimé");
    fetchEvenements(); fetchStats();
    if (evenementActif?.id === id) setEvenementActif(null);
  }

  async function supprimerGroupe(id) {
    if (!confirm("Supprimer ce groupe ?")) return;
    await fetch(`/api/admin/groupes/${id}`, { method: "DELETE", headers });
    showToast("✅ Groupe supprimé");
    fetchGroupes(); fetchStats();
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatDatetime(d) {
    return new Date(d).toLocaleString("fr-FR", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
  }

  const niveauColors = {
    debutant: "#00E676", intermediaire: "#0057FF", avance: "#FFB300", expert: "#FF3D57"
  };

  const actionColors = {
    EXPORT_DONNEES: { bg: "rgba(0,87,255,0.1)", color: "#0057FF" },
    SUPPRESSION_COMPTE: { bg: "rgba(255,61,87,0.1)", color: "#FF3D57" },
    LOGIN: { bg: "rgba(0,230,118,0.1)", color: "#00E676" },
    REGISTER: { bg: "rgba(0,229,255,0.1)", color: "#00E5FF" },
  };

  const logsFiltres = logs.filter(l => {
    if (!logsFilter) return true;
    return (
      l.action?.toLowerCase().includes(logsFilter.toLowerCase()) ||
      l.email?.toLowerCase().includes(logsFilter.toLowerCase()) ||
      l.details?.toLowerCase().includes(logsFilter.toLowerCase())
    );
  });

  // Vue participants événement
  if (evenementActif) {
    return (
      <div style={s.container} className="fade-in">
        {toast && <div style={s.toast}>{toast}</div>}
        <button style={s.backBtn} onClick={() => setEvenementActif(null)}>← Retour</button>
        <div style={s.eventHeader}>
          <div style={s.eventIcon}>{evenementActif.sport_icone}</div>
          <div>
            <h2 style={s.eventTitre}>{evenementActif.titre}</h2>
            <div style={s.eventMeta}>
              <span>📅 {formatDate(evenementActif.date_evenement)}</span>
              <span>📍 {evenementActif.ville}</span>
              <span>👤 {evenementActif.organisateur}</span>
              <span>✉️ {evenementActif.organisateur_email}</span>
            </div>
          </div>
          <button style={s.deleteEventBtn} onClick={() => supprimerEvenement(evenementActif.id)}>
            🗑️ Supprimer
          </button>
        </div>
        <div style={s.card}>
          <h3 style={s.cardTitle}>👥 Participants ({participants.length} / {evenementActif.nb_places})</h3>
          {participants.length === 0 ? (
            <p style={s.emptyText}>Aucun participant</p>
          ) : (
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Avatar", "Nom", "Email", "Ville", "Niveau", "Statut", "Inscrit le"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.avatar}>
                          {p.photo ? <img src={p.photo} style={s.avatarImg} alt="" />
                            : `${p.prenom?.[0] || "?"}${p.nom?.[0] || ""}`}
                        </div>
                      </td>
                      <td style={s.td}><div style={s.userName}>{p.prenom} {p.nom}</div></td>
                      <td style={s.td}><span style={s.email}>{p.email}</span></td>
                      <td style={s.td}><span style={s.meta}>{p.ville || "—"}</span></td>
                      <td style={s.td}>
                        <span style={{...s.niveauBadge, color: niveauColors[p.niveau] || "var(--text2)"}}>
                          {p.niveau || "—"}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.statutBadge,
                          background: p.statut === "accepte" ? "rgba(0,230,118,0.1)" : p.statut === "en_attente" ? "rgba(255,179,0,0.1)" : "rgba(255,61,87,0.1)",
                          color: p.statut === "accepte" ? "#00E676" : p.statut === "en_attente" ? "#FFB300" : "#FF3D57",
                        }}>
                          {p.statut === "accepte" ? "✅ Accepté" : p.statut === "en_attente" ? "⏳ En attente" : "❌ Refusé"}
                        </span>
                      </td>
                      <td style={s.td}><span style={s.meta}>{formatDate(p.joined_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.container} className="fade-in">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>🔒 Administration</h1>
        <p style={s.pageDesc}>Gestion complète de SportConnect</p>
      </div>

      <div style={s.tabs}>
        {[
          { id: "stats", label: "📊 Stats" },
          { id: "users", label: "👤 Utilisateurs" },
          { id: "evenements", label: "📅 Événements" },
          { id: "groupes", label: "👥 Groupes" },
          { id: "logs", label: "🔍 Logs" },
        ].map(t => (
          <button key={t.id}
            style={{...s.tab, ...(onglet === t.id ? s.tabActive : {})}}
            onClick={() => setOnglet(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {onglet === "stats" && stats && (
        <div style={s.statsGrid}>
          {[
            { label: "Utilisateurs", value: stats.users, icon: "👤", color: "#0057FF" },
            { label: "Sports joués", value: stats.sports, icon: "🏅", color: "#00E5FF" },
            { label: "Événements", value: stats.evenements, icon: "📅", color: "#FFB300" },
            { label: "Groupes", value: stats.groupes, icon: "👥", color: "#00E676" },
            { label: "Messages", value: stats.messages, icon: "💬", color: "#FF3D57" },
            { label: "Évaluations", value: stats.evaluations, icon: "⭐", color: "#FFB300" },
            { label: "Note moyenne", value: stats.note_moyenne ? `${stats.note_moyenne}/5` : "—", icon: "🏆", color: "#00E676" },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{...s.statIcon, background: stat.color + "20", color: stat.color}}>
                {stat.icon}
              </div>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {onglet === "users" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>👤 Tous les utilisateurs ({users.length})</h3>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Avatar", "Nom", "Email", "Ville", "Niveau", "Sports", "Messages", "Inscrit le", "Rôle", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.avatar}>
                        {u.photo ? <img src={u.photo} style={s.avatarImg} alt="" />
                          : `${u.prenom?.[0] || "?"}${u.nom?.[0] || ""}`}
                      </div>
                    </td>
                    <td style={s.td}><div style={s.userName}>{u.prenom || "—"} {u.nom || "—"}</div></td>
                    <td style={s.td}><span style={s.email}>{u.email}</span></td>
                    <td style={s.td}><span style={s.meta}>{u.ville || "—"}</span></td>
                    <td style={s.td}>
                      <span style={{...s.niveauBadge, color: niveauColors[u.niveau] || "var(--text2)"}}>
                        {u.niveau || "—"}
                      </span>
                    </td>
                    <td style={s.td}><span style={s.meta}>{u.nb_sports}</span></td>
                    <td style={s.td}><span style={s.meta}>{u.nb_messages}</span></td>
                    <td style={s.td}><span style={s.meta}>{formatDate(u.created_at)}</span></td>
                    <td style={s.td}>
                      <span style={u.role === "admin" ? s.adminBadge : s.userBadge}>
                        {u.role === "admin" ? "👑 Admin" : "👤 User"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.roleBtn}
                          onClick={() => changerRole(u.id, u.role === "admin" ? "user" : "admin")}>
                          {u.role === "admin" ? "⬇️" : "👑"}
                        </button>
                        <button style={s.deleteBtn} onClick={() => supprimerUser(u.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Événements */}
      {onglet === "evenements" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>📅 Tous les événements ({evenements.length})</h3>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Sport", "Titre", "Organisateur", "Ville", "Date", "Participants", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evenements.map(e => (
                  <tr key={e.id} style={s.tr}>
                    <td style={s.td}><span style={s.sportIcon}>{e.sport_icone} {e.sport_nom}</span></td>
                    <td style={s.td}><div style={s.userName}>{e.titre}</div></td>
                    <td style={s.td}>
                      <div style={s.userName}>{e.organisateur}</div>
                      <div style={s.email}>{e.organisateur_email}</div>
                    </td>
                    <td style={s.td}><span style={s.meta}>{e.ville || "—"}</span></td>
                    <td style={s.td}><span style={s.meta}>{formatDate(e.date_evenement)}</span></td>
                    <td style={s.td}>
                      <span style={{...s.meta, color: parseInt(e.nb_participants) >= parseInt(e.nb_places) ? "#FF3D57" : "#00E676"}}>
                        {e.nb_participants}/{e.nb_places}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.roleBtn} onClick={() => setEvenementActif(e)}>👥</button>
                        <button style={s.deleteBtn} onClick={() => supprimerEvenement(e.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Groupes */}
      {onglet === "groupes" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>👥 Tous les groupes ({groupes.length})</h3>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Sport", "Nom", "Créateur", "Ville", "Membres", "Privé", "Créé le", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupes.map(g => (
                  <tr key={g.id} style={s.tr}>
                    <td style={s.td}><span style={s.sportIcon}>{g.sport_icone} {g.sport_nom}</span></td>
                    <td style={s.td}><div style={s.userName}>{g.nom}</div></td>
                    <td style={s.td}>
                      <div style={s.userName}>{g.createur}</div>
                      <div style={s.email}>{g.createur_email}</div>
                    </td>
                    <td style={s.td}><span style={s.meta}>{g.ville || "—"}</span></td>
                    <td style={s.td}><span style={s.meta}>{g.nb_membres}</span></td>
                    <td style={s.td}>
                      <span style={g.prive ? s.adminBadge : s.userBadge}>
                        {g.prive ? "🔒 Privé" : "🌍 Public"}
                      </span>
                    </td>
                    <td style={s.td}><span style={s.meta}>{formatDate(g.created_at)}</span></td>
                    <td style={s.td}>
                      <button style={s.deleteBtn} onClick={() => supprimerGroupe(g.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs */}
      {onglet === "logs" && (
        <div style={s.card}>
          <div style={s.logsHeader}>
            <h3 style={s.cardTitle}>🔍 Audit Logs ({logsFiltres.length})</h3>
            <input style={s.logsSearch}
              placeholder="Filtrer par action, email, détail..."
              value={logsFilter}
              onChange={e => setLogsFilter(e.target.value)} />
          </div>
          {logsFiltres.length === 0 ? (
            <p style={s.emptyText}>Aucun log trouvé</p>
          ) : (
            <div style={s.logsList}>
              {logsFiltres.map(log => {
                const colors = actionColors[log.action] || { bg: "rgba(255,255,255,0.05)", color: "var(--text2)" };
                return (
                  <div key={log.id} style={s.logItem}>
                    <div style={s.logLeft}>
                      <span style={{...s.logAction, background: colors.bg, color: colors.color}}>
                        {log.action}
                      </span>
                      <span style={s.logDetails}>{log.details || "—"}</span>
                    </div>
                    <div style={s.logRight}>
                      <span style={s.logUser}>
                        {log.prenom ? `${log.prenom} ${log.nom}` : "Compte supprimé"}
                      </span>
                      <span style={s.logEmail}>{log.email || "—"}</span>
                      <span style={s.logDate}>{formatDatetime(log.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "1200px", margin: "0 auto" },
  toast: {
    position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
    background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem 1.5rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  pageHeader: { marginBottom: "1.5rem" },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  tabs: {
    display: "flex", gap: "0.5rem", marginBottom: "2rem",
    background: "var(--dark3)", borderRadius: "12px", padding: "4px",
    flexWrap: "wrap",
  },
  tab: {
    padding: "0.6rem 1.25rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  tabActive: { background: "var(--blue)", color: "white" },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem",
  },
  statCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", textAlign: "center",
  },
  statIcon: {
    width: "48px", height: "48px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.5rem", margin: "0 auto 0.75rem",
  },
  statValue: {
    fontFamily: "var(--font-display)", fontSize: "2rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  statLabel: { color: "var(--text2)", fontSize: "0.8rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  cardTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: "800", color: "white", marginBottom: "1.25rem",
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "var(--text2)", fontSize: "0.75rem", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: "1px",
    padding: "0.75rem 1rem", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
  td: { padding: "0.75rem 1rem", verticalAlign: "middle" },
  avatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.8rem", fontWeight: "900", color: "white", overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  userName: { color: "white", fontWeight: "600", fontSize: "0.9rem" },
  email: { color: "var(--text2)", fontSize: "0.8rem" },
  meta: { color: "var(--text2)", fontSize: "0.85rem" },
  niveauBadge: { fontSize: "0.82rem", fontWeight: "600", textTransform: "capitalize" },
  statutBadge: {
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  adminBadge: {
    background: "rgba(255,179,0,0.1)", color: "#FFB300",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  userBadge: {
    background: "rgba(255,255,255,0.05)", color: "var(--text2)",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  actions: { display: "flex", gap: "0.4rem" },
  roleBtn: {
    padding: "0.4rem 0.6rem", background: "rgba(0,87,255,0.1)",
    border: "1px solid rgba(0,87,255,0.3)", borderRadius: "8px",
    cursor: "pointer", fontSize: "0.85rem",
  },
  deleteBtn: {
    padding: "0.4rem 0.6rem", background: "rgba(255,61,87,0.1)",
    border: "1px solid rgba(255,61,87,0.3)", borderRadius: "8px",
    cursor: "pointer", fontSize: "0.85rem",
  },
  backBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text2)", padding: "0.5rem 1rem", borderRadius: "8px",
    cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", marginBottom: "1.5rem",
    display: "inline-block",
  },
  eventHeader: {
    display: "flex", gap: "1.5rem", alignItems: "center",
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.5rem",
  },
  eventIcon: { fontSize: "3rem", flexShrink: 0 },
  eventTitre: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "900", color: "white", marginBottom: "0.5rem",
  },
  eventMeta: { display: "flex", flexWrap: "wrap", gap: "1rem", color: "var(--text2)", fontSize: "0.85rem" },
  deleteEventBtn: {
    marginLeft: "auto", padding: "0.75rem 1.25rem",
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    borderRadius: "10px", color: "#FF3D57", cursor: "pointer",
    fontWeight: "700", fontSize: "0.85rem", flexShrink: 0,
  },
  emptyText: { color: "var(--text2)", fontSize: "0.9rem" },
  sportIcon: { color: "white", fontSize: "0.85rem" },
  // Logs
  logsHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap",
  },
  logsSearch: {
    padding: "0.65rem 1rem", background: "var(--dark4)",
    border: "2px solid transparent", borderRadius: "10px",
    color: "white", fontSize: "0.85rem", outline: "none",
    width: "280px",
  },
  logsList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  logItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: "1rem", padding: "0.75rem 1rem",
    background: "var(--dark4)", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap",
  },
  logLeft: { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 },
  logAction: {
    padding: "0.2rem 0.6rem", borderRadius: "6px",
    fontSize: "0.72rem", fontWeight: "700", whiteSpace: "nowrap",
  },
  logDetails: { color: "var(--text2)", fontSize: "0.82rem" },
  logRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.1rem" },
  logUser: { color: "white", fontWeight: "600", fontSize: "0.82rem" },
  logEmail: { color: "var(--text2)", fontSize: "0.75rem" },
  logDate: { color: "var(--text2)", fontSize: "0.72rem" },
};
