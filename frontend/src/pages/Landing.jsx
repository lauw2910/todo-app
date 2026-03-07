import { useState } from "react";

export default function Landing({ onGetStarted, onShowLegal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sports = [
    { nom: "Football", icone: "⚽" }, { nom: "Tennis", icone: "🎾" },
    { nom: "Basketball", icone: "🏀" }, { nom: "Running", icone: "🏃" },
    { nom: "Natation", icone: "🏊" }, { nom: "Cyclisme", icone: "🚴" },
    { nom: "Padel", icone: "🎾" }, { nom: "Boxe", icone: "🥊" },
    { nom: "Yoga", icone: "🧘" }, { nom: "Escalade", icone: "🧗" },
  ];

  const features = [
    { icon: "🔍", titre: "Trouve des joueurs", desc: "Recherche par sport, ville et niveau" },
    { icon: "🗺️", titre: "Carte interactive", desc: "Visualise les sportifs près de chez toi" },
    { icon: "📅", titre: "Événements", desc: "Crée ou rejoins des événements sportifs" },
    { icon: "💬", titre: "Messagerie", desc: "Échange directement avec les joueurs" },
    { icon: "⭐", titre: "Évaluations", desc: "Note et sois noté par la communauté" },
    { icon: "📱", titre: "100% Mobile", desc: "Application responsive sur tous les écrans" },
  ];

  const temoignages = [
    { nom: "Marie L.", sport: "Tennis 🎾", note: 5, texte: "J'ai trouvé mon partenaire de tennis en 10 minutes !" },
    { nom: "Thomas B.", sport: "Football ⚽", note: 5, texte: "Super appli, j'organise des matchs chaque weekend maintenant." },
    { nom: "Sophie M.", sport: "Running 🏃", note: 5, texte: "La carte est géniale pour trouver des runners dans mon quartier." },
  ];

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <span style={s.navLogoIcon}>⚡</span>
          <span style={s.navLogoText}>Sport<span style={s.navLogoAccent}>Connect</span></span>
        </div>
        <div style={s.navBtns}>
          <button style={s.navLoginBtn} onClick={onGetStarted}>Se connecter</button>
          <button style={s.navCTABtn} onClick={onGetStarted}>Commencer</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroDecor1}/>
        <div style={s.heroDecor2}/>
        <div style={s.heroContent}>
          <div style={s.heroBadge}>🏆 La plateforme des sportifs amateurs</div>
          <h1 style={s.heroTitle}>
            Trouve ton partenaire<br/>
            <span style={s.heroTitleAccent}>sportif idéal</span>
          </h1>
          <p style={s.heroDesc}>
            Rejoins des milliers de sportifs, organise des événements,
            rejoins des groupes et trouve des partenaires près de chez toi.
          </p>
          <div style={s.heroCTAs}>
            <button style={s.heroCTAPrimary} onClick={onGetStarted}>
              🚀 Commencer gratuitement
            </button>
            <button style={s.heroCTASecondary} onClick={onGetStarted}>
              Se connecter →
            </button>
          </div>
          <div style={s.heroStats}>
            {[
              { num: "2 400+", label: "Sportifs inscrits" },
              { num: "20+", label: "Sports disponibles" },
              { num: "50+", label: "Villes couvertes" },
            ].map(stat => (
              <div key={stat.label} style={s.heroStat}>
                <span style={s.heroStatNum}>{stat.num}</span>
                <span style={s.heroStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards déco */}
        <div style={s.heroCards}>
          <div style={s.heroCard}>
            <div style={s.heroCardAvatar}>JD</div>
            <div>
              <div style={s.heroCardNom}>Jean D.</div>
              <div style={s.heroCardSport}>⚽ Football • Paris</div>
              <div style={s.heroCardNote}>★★★★★</div>
            </div>
          </div>
          <div style={{...s.heroCard, marginTop: "1rem"}}>
            <div style={{...s.heroCardAvatar, background: "linear-gradient(135deg, #00E5FF, #0057FF)"}}>ML</div>
            <div>
              <div style={s.heroCardNom}>Marie L.</div>
              <div style={s.heroCardSport}>🎾 Tennis • Lyon</div>
              <div style={s.heroCardNote}>★★★★★</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>20+ sports disponibles</h2>
        <div style={s.sportsGrid}>
          {sports.map(sport => (
            <div key={sport.nom} style={s.sportChip}>
              <span>{sport.icone}</span>
              <span>{sport.nom}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{...s.section, background: "var(--dark2)"}}>
        <h2 style={s.sectionTitle}>Tout ce dont tu as besoin</h2>
        <div style={s.featuresGrid}>
          {features.map(f => (
            <div key={f.titre} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitre}>{f.titre}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Ce qu'en disent nos sportifs</h2>
        <div style={s.temoignagesGrid}>
          {temoignages.map(t => (
            <div key={t.nom} style={s.temoignageCard}>
              <div style={s.temoignageNote}>{"★".repeat(t.note)}</div>
              <p style={s.temoignageTexte}>"{t.texte}"</p>
              <div style={s.temoignageAuteur}>
                <div style={s.temoignageAvatar}>{t.nom[0]}</div>
                <div>
                  <div style={s.temoignageNom}>{t.nom}</div>
                  <div style={s.temoignageSport}>{t.sport}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section style={s.ctaSection}>
        <div style={s.ctaDecor}/>
        <h2 style={s.ctaTitle}>Prêt à trouver ton partenaire sportif ?</h2>
        <p style={s.ctaDesc}>Rejoins la communauté SportConnect gratuitement</p>
        <button style={s.ctaBtn} onClick={onGetStarted}>
          🚀 Créer mon compte gratuitement
        </button>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerTop}>
          <div style={s.footerLogo}>
            <span>⚡</span>
            <span style={s.footerLogoText}>Sport<span style={s.footerAccent}>Connect</span></span>
          </div>
          <div style={s.footerLinks}>
            <button style={s.footerLink} onClick={() => onShowLegal("cgu")}>CGU</button>
            <button style={s.footerLink} onClick={() => onShowLegal("confidentialite")}>
              Politique de confidentialité
            </button>
            <button style={s.footerLink} onClick={() => onShowLegal("donnees")}>
              Mes données
            </button>
          </div>
        </div>
        <p style={s.copyright}>© 2026 SportConnect — Tous droits réservés</p>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "var(--dark)" },
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1rem 2rem", background: "rgba(10,14,26,0.9)",
    backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  navLogoIcon: { fontSize: "1.5rem" },
  navLogoText: { fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: "800", color: "white" },
  navLogoAccent: { color: "var(--cyan)" },
  navBtns: { display: "flex", gap: "0.75rem" },
  navLoginBtn: {
    padding: "0.6rem 1.25rem", background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem",
  },
  navCTABtn: {
    padding: "0.6rem 1.25rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    border: "none", borderRadius: "10px",
    color: "white", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem",
  },
  hero: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "8rem 2rem 4rem",
    maxWidth: "1200px", margin: "0 auto", position: "relative",
    gap: "2rem",
  },
  heroDecor1: {
    position: "fixed", top: "-100px", left: "-100px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,87,255,0.12) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  heroDecor2: {
    position: "fixed", bottom: "-100px", right: "-100px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  heroContent: { flex: 1, maxWidth: "600px", position: "relative", zIndex: 1 },
  heroBadge: {
    display: "inline-block", background: "rgba(0,87,255,0.15)",
    border: "1px solid rgba(0,87,255,0.3)", color: "var(--cyan)",
    padding: "0.4rem 1rem", borderRadius: "20px",
    fontSize: "0.85rem", fontWeight: "700", marginBottom: "1.5rem",
  },
  heroTitle: {
    fontFamily: "var(--font-display)", fontSize: "4rem",
    fontWeight: "900", color: "white", lineHeight: "1.05",
    letterSpacing: "-1px", marginBottom: "1.5rem",
  },
  heroTitleAccent: {
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroDesc: { color: "var(--text2)", fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "2rem" },
  heroCTAs: { display: "flex", gap: "1rem", marginBottom: "2.5rem", flexWrap: "wrap" },
  heroCTAPrimary: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontSize: "1rem", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,87,255,0.3)",
  },
  heroCTASecondary: {
    padding: "1rem 2rem", background: "transparent",
    border: "2px solid rgba(255,255,255,0.15)", borderRadius: "12px",
    color: "white", fontSize: "1rem", fontWeight: "600", cursor: "pointer",
  },
  heroStats: { display: "flex", gap: "2rem", flexWrap: "wrap" },
  heroStat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  heroStatNum: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "900", color: "var(--cyan)",
  },
  heroStatLabel: { color: "var(--text2)", fontSize: "0.8rem" },
  heroCards: { display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 },
  heroCard: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    background: "var(--dark3)", borderRadius: "14px", padding: "1rem 1.25rem",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    animation: "fadeInUp 0.6s ease forwards",
  },
  heroCardAvatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white", fontSize: "1rem",
  },
  heroCardNom: { color: "white", fontWeight: "700", fontSize: "0.9rem" },
  heroCardSport: { color: "var(--text2)", fontSize: "0.8rem" },
  heroCardNote: { color: "#FFB300", fontSize: "0.75rem" },
  section: { padding: "5rem 2rem", maxWidth: "1200px", margin: "0 auto" },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", textAlign: "center", marginBottom: "3rem",
  },
  sportsGrid: {
    display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center",
  },
  sportChip: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "var(--dark3)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "20px", padding: "0.6rem 1.25rem",
    color: "white", fontSize: "0.9rem", fontWeight: "600",
  },
  featuresGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem",
  },
  featureCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.75rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  featureIcon: { fontSize: "2rem", marginBottom: "1rem" },
  featureTitre: { color: "white", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" },
  featureDesc: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.6" },
  temoignagesGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem",
  },
  temoignageCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.75rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  temoignageNote: { color: "#FFB300", fontSize: "1.1rem", marginBottom: "1rem" },
  temoignageTexte: { color: "var(--text2)", fontSize: "0.9rem", lineHeight: "1.7", marginBottom: "1.5rem" },
  temoignageAuteur: { display: "flex", alignItems: "center", gap: "0.75rem" },
  temoignageAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
  },
  temoignageNom: { color: "white", fontWeight: "700", fontSize: "0.9rem" },
  temoignageSport: { color: "var(--text2)", fontSize: "0.8rem" },
  ctaSection: {
    padding: "6rem 2rem", textAlign: "center", position: "relative",
    background: "linear-gradient(135deg, var(--dark2), var(--dark3))",
  },
  ctaDecor: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at center, rgba(0,87,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ctaTitle: {
    fontFamily: "var(--font-display)", fontSize: "3rem",
    fontWeight: "900", color: "white", marginBottom: "1rem", position: "relative",
  },
  ctaDesc: { color: "var(--text2)", fontSize: "1.1rem", marginBottom: "2rem", position: "relative" },
  ctaBtn: {
    padding: "1.1rem 2.5rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "14px",
    fontSize: "1.1rem", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,87,255,0.4)", position: "relative",
  },
  footer: {
    background: "var(--dark2)", borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "2rem",
  },
  footerTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: "1rem", marginBottom: "1rem",
    maxWidth: "1200px", margin: "0 auto 1rem",
  },
  footerLogo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  footerLogoText: { fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "800", color: "white" },
  footerAccent: { color: "var(--cyan)" },
  footerLinks: { display: "flex", gap: "1.5rem", flexWrap: "wrap" },
  footerLink: {
    background: "none", border: "none", color: "var(--text2)",
    cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
    textDecoration: "underline",
  },
  copyright: { color: "var(--text2)", fontSize: "0.8rem", textAlign: "center" },
};
