import { useState, useEffect } from "react";
import Profil from "./Profil";
import Joueurs from "./Joueurs";
import Evenements from "./Evenements";
import Messages from "./Messages";
import Carte from "./Carte";
import Admin from "./Admin";
import Groupes from "./Groupes";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Dashboard({ token, user, onLogout, onShowLegal }) {
  const [page, setPage] = useState("accueil");
  const [contactUser, setContactUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();

  async function fetchUnread() {
    const res = await fetch("/api/messages", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      const total = data.reduce((sum, c) => sum + parseInt(c.non_lus || 0), 0);
      setUnreadCount(total);
    }
  }

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleContact(joueur) {
    setContactUser({
      other_user: joueur.id,
      prenom: joueur.prenom,
      nom: joueur.nom,
    });
    setPage("messages");
  }

  const isAdmin = user?.role === "admin";

  const navItems = [
    { id: "accueil", icon: "🏠", label: "Accueil" },
    { id: "joueurs", icon: "🔍", label: "Joueurs" },
    { id: "carte", icon: "🗺️", label: "Carte" },
    { id: "evenements", icon: "📅", label: "Événements" },
    { id: "groupes", icon: "👥", label: "Groupes" },
    { id: "messages", icon: "💬", label: "Messages", badge: unreadCount },
    { id: "profil", icon: "👤", label: "Profil" },
    ...(isAdmin ? [{ id: "admin", icon: "🔒", label: "Admin" }] : []),
  ];

  const bottomNavItems = [
    { id: "accueil", icon: "🏠", label: "Accueil" },
    { id: "joueurs", icon: "🔍", label: "Joueurs" },
    { id: "evenements", icon: "📅", label: "Événements" },
    { id: "messages", icon: "💬", label: "Messages", badge: unreadCount },
    { id: "profil", icon: "👤", label: "Profil" },
  ];

  return (
    <div style={s.container}>
      {!isMobile && (
        <aside style={s.sidebar}>
          <div style={s.sidebarLogo}>
            <span style={s.logoIcon}>⚡</span>
            <span style={s.logoText}>Sport<span style={s.logoAccent}>Connect</span></span>
          </div>
          <nav style={s.nav}>
            {navItems.map(item => (
              <button key={item.id}
                style={{...s.navItem, ...(page === item.id ? s.navItemActive : {}), ...(item.id === "admin" ? s.navItemAdmin : {})}}
                onClick={() => setPage(item.id)}>
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navLabel}>{item.label}</span>
                {item.badge > 0 && <span style={s.navBadge}>{item.badge}</span>}
                {page === item.id && <div style={s.navIndicator}/>}
              </button>
            ))}
          </nav>
          <div style={s.sidebarBottom}>
            <div style={s.userInfo}>
              <div style={s.userAvatar}>{user?.prenom?.[0]?.toUpperCase() || "?"}</div>
              <div>
                <div style={s.userName}>{user?.prenom} {user?.nom}</div>
                <div style={s.userEmail}>{isAdmin ? "👑 Admin" : user?.email}</div>
              </div>
            </div>
            <button style={s.logoutBtn} onClick={onLogout}>↩ Déconnexion</button>
            {onShowLegal && (
              <button style={s.legalBtn} onClick={() => onShowLegal("cgu")}>
                ⚖️ CGU & Confidentialité
              </button>
            )}
          </div>
        </aside>
      )}

      {isMobile && (
        <header style={s.mobileHeader}>
          <span style={s.logoIcon}>⚡</span>
          <span style={s.logoText}>Sport<span style={s.logoAccent}>Connect</span></span>
          <button style={s.mobileLogout} onClick={onLogout}>↩</button>
        </header>
      )}

      <main style={isMobile ? s.mainMobile : s.main}>
        {page === "accueil" && <Accueil user={user} setPage={setPage} isAdmin={isAdmin} isMobile={isMobile} token={token} onShowLegal={onShowLegal} />}
        {page === "profil" && <Profil token={token} />}
        {page === "joueurs" && <Joueurs token={token} onContact={handleContact} />}
        {page === "carte" && <Carte token={token} onContact={handleContact} />}
        {page === "evenements" && <Evenements token={token} />}
        {page === "groupes" && <Groupes token={token} userId={user?.id} userRole={user?.role} />}
        {page === "messages" && <Messages token={token} userId={user?.id} initialUser={contactUser} />}
        {page === "admin" && isAdmin && <Admin token={token} />}
      </main>

      {isMobile && (
        <nav style={s.bottomNav}>
          {bottomNavItems.map(item => (
            <button key={item.id}
              style={{...s.bottomNavItem, ...(page === item.id ? s.bottomNavItemActive : {})}}
              onClick={() => setPage(item.id)}>
              <span style={s.bottomNavIcon}>{item.icon}</span>
              <span style={s.bottomNavLabel}>{item.label}</span>
              {item.badge > 0 && <span style={s.bottomNavBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function Accueil({ user, setPage, isAdmin, isMobile, token, onShowLegal }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/stats", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => setStats(data));
  }, []);

  const cards = [
    { id: "joueurs", icon: "🔍", label: "Trouver des joueurs", desc: "Cherche des partenaires par sport et ville", color: "#0057FF" },
    { id: "carte", icon: "🗺️", label: "Carte des joueurs", desc: "Voir les sportifs près de chez toi sur la carte", color: "#00E5FF" },
    { id: "groupes", icon: "👥", label: "Groupes sportifs", desc: "Rejoins des équipes et échange en groupe", color: "#00E676" },
    { id: "evenements", icon: "📅", label: "Événements", desc: "Rejoins ou crée des événements sportifs", color: "#FFB300" },
  ];

  const statItems = [
    { label: "Contacts", value: stats?.conversations ?? "—", icon: "💬" },
    { label: "Événements", value: stats?.evenements_rejoints ?? "—", icon: "📅" },
    { label: "Sports", value: stats?.sports_pratiques ?? "—", icon: "🏅" },
    { label: "Note", value: stats?.note_moyenne > 0 ? `${stats.note_moyenne}★` : "—", icon: "⭐" },
  ];

  return (
    <div style={s.content} className="fade-in">
      <div style={{...s.hero, ...(isMobile ? s.heroMobile : {})}}>
        <div style={s.heroText}>
          <p style={s.heroGreeting}>Bonjour,</p>
          <h1 style={{...s.heroTitle, ...(isMobile ? {fontSize: "2rem"} : {})}}>{user?.prenom || "Sportif"} 👋</h1>
          <p style={s.heroSub}>Prêt à trouver ton prochain partenaire sportif ?</p>
        </div>
        <div style={{...s.heroStats, ...(isMobile ? s.heroStatsMobile : {})}}>
          {statItems.map(stat => (
            <div key={stat.label} style={s.heroStat}>
              <span style={s.heroStatIcon}>{stat.icon}</span>
              <span style={s.heroStatNum}>{stat.value}</span>
              <span style={s.heroStatLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {stats?.note_moyenne > 0 && (
        <div style={s.noteCard}>
          <span style={s.noteStars}>{"★".repeat(Math.round(stats.note_moyenne))}{"☆".repeat(5 - Math.round(stats.note_moyenne))}</span>
          <span style={s.noteText}>Ta note moyenne : <strong>{stats.note_moyenne}/5</strong> ({stats.nb_avis} avis)</span>
        </div>
      )}

      <h2 style={s.sectionTitle}>Que veux-tu faire ?</h2>
      <div style={{...s.cards, ...(isMobile ? s.cardsMobile : {})}}>
        {cards.map(card => (
          <div key={card.id} style={s.card} onClick={() => setPage(card.id)}>
            <div style={{...s.cardIcon, background: card.color + "20", color: card.color}}>{card.icon}</div>
            <h3 style={s.cardTitle}>{card.label}</h3>
            <p style={s.cardDesc}>{card.desc}</p>
            <div style={{...s.cardArrow, color: card.color}}>→</div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div style={s.adminCard} onClick={() => setPage("admin")}>
          <span>🔒</span>
          <span>Accéder au panneau d'administration</span>
          <span style={{marginLeft: "auto"}}>→</span>
        </div>
      )}

      {onShowLegal && (
        <div style={s.legalFooter}>
          <button style={s.legalFooterLink} onClick={() => onShowLegal("cgu")}>CGU</button>
          <span style={s.legalSep}>•</span>
          <button style={s.legalFooterLink} onClick={() => onShowLegal("confidentialite")}>
            Politique de confidentialité
          </button>
          <span style={s.legalSep}>•</span>
          <button style={s.legalFooterLink} onClick={() => onShowLegal("donnees")}>
            Mes données
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: "260px", background: "var(--dark2)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column",
    padding: "1.5rem 1rem", position: "fixed",
    top: 0, left: 0, height: "100vh", zIndex: 10,
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.5rem", marginBottom: "2.5rem",
  },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: "800", color: "white" },
  logoAccent: { color: "var(--cyan)" },
  nav: { display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.85rem 1rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "12px",
    fontSize: "0.95rem", fontWeight: "500", position: "relative",
    transition: "all 0.2s", textAlign: "left", width: "100%",
  },
  navItemActive: { background: "rgba(0, 87, 255, 0.15)", color: "white" },
  navItemAdmin: { color: "#FF3D57" },
  navIcon: { fontSize: "1.1rem" },
  navLabel: { flex: 1 },
  navBadge: {
    background: "#FF3D57", color: "white", borderRadius: "50%",
    width: "20px", height: "20px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "700",
  },
  navIndicator: {
    width: "4px", height: "20px", background: "var(--blue)",
    borderRadius: "2px", position: "absolute", right: "8px",
  },
  sidebarBottom: { borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" },
  userInfo: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" },
  userAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "var(--blue)", display: "flex", alignItems: "center",
    justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0,
  },
  userName: { color: "white", fontWeight: "600", fontSize: "0.9rem" },
  userEmail: { color: "var(--text2)", fontSize: "0.75rem" },
  logoutBtn: {
    width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
    marginBottom: "0.5rem",
  },
  legalBtn: {
    width: "100%", padding: "0.5rem", background: "transparent",
    border: "none", color: "var(--text2)", cursor: "pointer",
    fontSize: "0.75rem", fontWeight: "600", textDecoration: "underline",
  },
  mobileHeader: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem",
    height: "60px",
  },
  mobileLogout: {
    marginLeft: "auto", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    color: "var(--text2)", cursor: "pointer", padding: "0.4rem 0.75rem", fontSize: "0.9rem",
  },
  bottomNav: {
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
    background: "var(--dark2)", borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex", height: "65px",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  bottomNavItem: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "0.2rem",
    border: "none", background: "transparent", cursor: "pointer", position: "relative",
  },
  bottomNavItemActive: { background: "rgba(0,87,255,0.1)" },
  bottomNavIcon: { fontSize: "1.3rem" },
  bottomNavLabel: { color: "var(--text2)", fontSize: "0.6rem", fontWeight: "600" },
  bottomNavBadge: {
    position: "absolute", top: "6px", right: "calc(50% - 18px)",
    background: "#FF3D57", color: "white", borderRadius: "50%",
    width: "16px", height: "16px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700",
  },
  main: { marginLeft: "260px", flex: 1, padding: "2rem", minHeight: "100vh" },
  mainMobile: {
    flex: 1, padding: "1rem",
    paddingTop: "75px",
    paddingBottom: "calc(65px + env(safe-area-inset-bottom))",
    minHeight: "100vh",
  },
  content: { maxWidth: "1000px", margin: "0 auto" },
  hero: {
    background: "linear-gradient(135deg, var(--dark3), var(--dark4))",
    borderRadius: "20px", padding: "2.5rem",
    border: "1px solid rgba(0,87,255,0.2)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "2.5rem",
  },
  heroMobile: { padding: "1.5rem", flexDirection: "column", alignItems: "flex-start" },
  heroText: {},
  heroGreeting: { color: "var(--text2)", fontSize: "1rem", marginBottom: "0.25rem" },
  heroTitle: { fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: "900", color: "white", marginBottom: "0.5rem" },
  heroSub: { color: "var(--text2)", fontSize: "0.95rem" },
  heroStats: { display: "flex", gap: "2rem" },
  heroStatsMobile: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem", width: "100%" },
  heroStat: { textAlign: "center" },
  heroStatIcon: { display: "block", fontSize: "1.2rem", marginBottom: "0.25rem" },
  heroStatNum: { display: "block", fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: "900", color: "var(--cyan)" },
  heroStatLabel: { color: "var(--text2)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" },
  noteCard: {
    display: "flex", alignItems: "center", gap: "1rem",
    background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.2)",
    borderRadius: "12px", padding: "1rem 1.5rem", marginBottom: "1.5rem",
  },
  noteStars: { color: "#FFB300", fontSize: "1.2rem", letterSpacing: "2px" },
  noteText: { color: "var(--text2)", fontSize: "0.9rem" },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: "800", color: "white", marginBottom: "1.5rem" },
  cards: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginBottom: "1.5rem" },
  cardsMobile: { gridTemplateColumns: "1fr", gap: "1rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
    transition: "transform 0.2s",
  },
  cardIcon: {
    width: "48px", height: "48px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.5rem", marginBottom: "1rem",
  },
  cardTitle: { color: "white", fontWeight: "700", marginBottom: "0.5rem", fontSize: "1rem" },
  cardDesc: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1rem" },
  cardArrow: { fontSize: "1.2rem", fontWeight: "700" },
  adminCard: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    background: "rgba(255,61,87,0.08)", border: "1px solid rgba(255,61,87,0.2)",
    borderRadius: "12px", padding: "1rem 1.5rem", cursor: "pointer",
    color: "#FF3D57", fontWeight: "600", fontSize: "0.9rem", marginBottom: "1.5rem",
  },
  legalFooter: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap",
  },
  legalFooterLink: {
    background: "none", border: "none", color: "var(--text2)",
    cursor: "pointer", fontSize: "0.8rem", fontWeight: "600",
    textDecoration: "underline",
  },
  legalSep: { color: "var(--text2)", fontSize: "0.8rem" },
};
