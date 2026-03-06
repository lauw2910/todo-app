import { useState, useEffect } from "react";

export default function Admin({ token }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [onglet, setOnglet] = useState("stats");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchStats() {
    const res = await fetch("/api/admin/stats", { headers });
    const data = await res.json();
    setStats(data);
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users", { headers });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function deleteUser(id, nom) {
    if (!confirm(`Supprimer ${nom} ?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers });
    const data = await res.json();
    if (res.ok) {
      showMsg("✅ Utilisateur supprimé");
      fetchUsers();
      fetchStats();
    } else {
      showMsg("❌ " + data.error);
    }
  }

  async function toggleRole(id, roleActuel) {
    const newRole = roleActuel === "admin" ? "user" : "admin";
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT", headers,
      body: JSON.stringify({ role: newRole }),
    });
    showMsg(`✅ Rôle mis à jour → ${newRole}`);
    fetchUsers();
  }

  function showMsg(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  function formatDate(d) {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  const statCards = stats ? [
    { label: "Utilisateurs", value: stats.users, icon: "👥", color: "#0057FF" },
    { label: "Sports joués", value: stats.sports, icon: "🏅", color: "#00E5FF" },
    { label: "Événements", value: stats.evenements, icon: "📅", color: "#00E676" },
    { label: "Messages", value: stats.messages, icon: "💬", color: "#FFB300" },
    { label: "Évaluations", value: stats.evaluations, icon: "⭐", color: "#FF3D57" },
    { label: "Note moyenne", value: stats.note_moyenne + "/5", icon: "📊", color: "#9C27B0" },
  ] : [];

  return (
    <div style={s.container} className="fade-in">
      <div style={s.pageHeader}>
        <div>
          <div style={s.adminBadge}>🔒 ADMIN</div>
          <h1 style={s.pageTitle}>Tableau de bord admin</h1>
          <p style={s.pageDesc}>Gestion complète de SportConnect</p>
        </div>
      </div>

      {message && <div style={s.toast}>{message}</div>}

      {/* Onglets */}
      <div style={s.tabs}>
        <button style={{...s.tab, ...(onglet === "stats" ? s.tabActive : {})}}
          onClick={() => setOnglet("stats")}>
          📊 Statistiques
        </button>
        <button style={{...s.tab, ...(onglet === "users" ? s.tabActive : {})}}
          onClick={() => setOnglet("users")}>
          👥 Utilisateurs
          <span style={s.tabBadge}>{users.length}</span>
        </button>
      </div>

      {/* Stats */}
      {onglet === "stats" && (
        <div className="fade-in">
          <div style={s.statsGrid}>
            {statCards.map(card => (
              <div key={card.label} style={s.statCard}>
                <div style={{...s.statIcon, background: card.color + "20", color: card.color}}>
                  {card.icon}
                </div>
                <div style={{...s.statValue, color: card.color}}>{card.value}</div>
                <div style={s.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {onglet === "users" && (
        <div className="fade-in">
          {loading ? (
            <div style={s.loading}>
              <div style={s.spinner}/>
              <p style={{color: "var(--text2)"}}>Chargement...</p>
            </div>
          ) : (
            <div style={s.table}>
              <div style={s.tableHeader}>
                <div style={{...s.th, flex: 2}}>Utilisateur</div>
                <div style={s.th}>Ville</div>
                <div style={s.th}>Niveau</div>
                <div style={s.th}>Sports</div>
                <div style={s.th}>Messages</div>
                <div style={s.th}>Inscrit le</div>
                <div style={s.th}>Rôle</div>
                <div style={s.th}>Actions</div>
              </div>

              {users.map(user => (
                <div key={user.id} style={s.tableRow}>
                  <div style={{...s.td, flex: 2}}>
                    <div style={s.userCell}>
                      <div style={s.userAvatar}>
                        {user.prenom?.[0]?.toUpperCase()}{user.nom?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={s.userName}>{user.prenom} {user.nom}</div>
                        <div style={s.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div style={s.td}>{user.ville || "—"}</div>
                  <div style={s.td}>
                    <span style={{
                      ...s.niveauBadge,
                      background: {
                        debutant: "rgba(0,230,118,0.1)", intermediaire: "rgba(0,87,255,0.1)",
                        avance: "rgba(255,179,0,0.1)", expert: "rgba(255,61,87,0.1)"
                      }[user.niveau] || "rgba(255,255,255,0.05)",
                      color: {
                        debutant: "#00E676", intermediaire: "#0057FF",
                        avance: "#FFB300", expert: "#FF3D57"
                      }[user.niveau] || "white",
                    }}>{user.niveau}</span>
                  </div>
                  <div style={s.td}>{user.nb_sports}</div>
                  <div style={s.td}>{user.nb_messages}</div>
                  <div style={s.td}>{formatDate(user.created_at)}</div>
                  <div style={s.td}>
                    <span style={{
                      ...s.roleBadge,
                      background: user.role === "admin" ? "rgba(255,61,87,0.15)" : "rgba(255,255,255,0.05)",
                      color: user.role === "admin" ? "#FF3D57" : "var(--text2)",
                    }}>
                      {user.role === "admin" ? "👑 Admin" : "👤 User"}
                    </span>
                  </div>
                  <div style={{...s.td, display: "flex", gap: "0.4rem"}}>
                    <button style={s.roleBtn} onClick={() => toggleRole(user.id, user.role)}
                      title={user.role === "admin" ? "Rétrograder" : "Promouvoir admin"}>
                      {user.role === "admin" ? "⬇️" : "👑"}
                    </button>
                    <button style={s.deleteBtn} onClick={() => deleteUser(user.id, `${user.prenom} ${user.nom}`)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "1100px", margin: "0 auto" },
  pageHeader: { marginBottom: "1.5rem" },
  adminBadge: {
    display: "inline-block", background: "rgba(255,61,87,0.15)",
    border: "1px solid rgba(255,61,87,0.3)", color: "#FF3D57",
    padding: "0.3rem 0.75rem", borderRadius: "20px",
    fontSize: "0.75rem", fontWeight: "700", letterSpacing: "2px",
    marginBottom: "0.5rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  toast: {
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "1rem", borderRadius: "12px",
    marginBottom: "1.5rem", fontWeight: "600",
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
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem",
  },
  statCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
  },
  statIcon: {
    width: "56px", height: "56px", borderRadius: "16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.5rem", marginBottom: "0.5rem",
  },
  statValue: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900",
  },
  statLabel: { color: "var(--text2)", fontSize: "0.85rem", fontWeight: "600" },
  loading: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "1rem", padding: "3rem",
  },
  spinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
  },
  table: {
    background: "var(--dark3)", borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden",
  },
  tableHeader: {
    display: "flex", padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "var(--dark4)",
  },
  th: {
    flex: 1, color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px",
  },
  tableRow: {
    display: "flex", alignItems: "center", padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 0.2s",
  },
  td: { flex: 1, color: "white", fontSize: "0.85rem" },
  userCell: { display: "flex", alignItems: "center", gap: "0.75rem" },
  userAvatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.85rem", fontWeight: "900", color: "white", flexShrink: 0,
  },
  userName: { color: "white", fontWeight: "600", fontSize: "0.9rem" },
  userEmail: { color: "var(--text2)", fontSize: "0.75rem" },
  niveauBadge: {
    padding: "0.2rem 0.6rem", borderRadius: "20px",
    fontSize: "0.75rem", fontWeight: "700",
  },
  roleBadge: {
    padding: "0.2rem 0.6rem", borderRadius: "20px",
    fontSize: "0.75rem", fontWeight: "700",
  },
  roleBtn: {
    padding: "0.4rem 0.6rem", background: "rgba(255,179,0,0.1)",
    border: "1px solid rgba(255,179,0,0.3)", borderRadius: "8px",
    cursor: "pointer", fontSize: "0.85rem",
  },
  deleteBtn: {
    padding: "0.4rem 0.6rem", background: "rgba(255,61,87,0.1)",
    border: "1px solid rgba(255,61,87,0.3)", borderRadius: "8px",
    cursor: "pointer", fontSize: "0.85rem",
  },
};
