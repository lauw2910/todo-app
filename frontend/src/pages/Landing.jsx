export default function Landing({ onGetStarted }) {
  const features = [
    { icon: "🔍", title: "Trouve des joueurs", desc: "Recherche des partenaires sportifs par sport et par ville en quelques secondes." },
    { icon: "🗺️", title: "Carte interactive", desc: "Visualise les sportifs autour de toi sur une carte et contacte-les directement." },
    { icon: "📅", title: "Crée des événements", desc: "Organise ou rejoins des événements sportifs près de chez toi." },
    { icon: "💬", title: "Messagerie intégrée", desc: "Échange avec tes futurs partenaires directement dans l'application." },
    { icon: "⭐", title: "Système d'évaluation", desc: "Note tes partenaires et consulte les avis pour choisir les meilleurs." },
    { icon: "📱", title: "100% Mobile", desc: "Application responsive, accessible depuis ton téléphone partout et à tout moment." },
  ];

  const sports = ["⚽ Football", "🎾 Tennis", "🏀 Basketball", "🏃 Running", "🏊 Natation", "🚴 Cyclisme", "🏐 Volleyball", "🏸 Badminton", "🏉 Rugby", "🥾 Randonnée"];

  const temoignages = [
    { nom: "Thomas L.", ville: "Paris", sport: "🎾 Tennis", texte: "J'ai trouvé un partenaire de tennis en 10 minutes. On joue ensemble chaque semaine maintenant !", note: 5 },
    { nom: "Sarah M.", ville: "Lyon", sport: "🏃 Running", texte: "Super appli pour trouver des compagnons de running. La carte est vraiment pratique !", note: 5 },
    { nom: "Marc D.", ville: "Bordeaux", sport: "⚽ Football", texte: "J'ai rejoint une équipe de foot du quartier grâce aux événements. Vraiment top !", note: 4 },
  ];

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navLogo}>
          <span style={s.navLogoIcon}>⚡</span>
          <span style={s.navLogoText}>Sport<span style={s.navLogoAccent}>Connect</span></span>
        </div>
        <button style={s.navCta} onClick={onGetStarted}>
          Se connecter →
        </button>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroDecor1}/>
        <div style={s.heroDecor2}/>
        <div style={s.heroContent}>
          <div style={s.heroBadge}>🏆 La plateforme sportive #1</div>
          <h1 style={s.heroTitle}>
            Trouve ton<br/>
            <span style={s.heroTitleAccent}>partenaire sportif</span><br/>
            idéal
          </h1>
          <p style={s.heroDesc}>
            Connecte-toi avec des milliers de sportifs près de chez toi.
            Peu importe ton sport ou ton niveau, trouve le partenaire parfait en quelques clics.
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroBtnPrimary} onClick={onGetStarted}>
              🚀 Commencer gratuitement
            </button>
            <button style={s.heroBtnSecondary} onClick={onGetStarted}>
              Se connecter
            </button>
          </div>
          <div style={s.heroStats}>
            {[
              { num: "2 400+", label: "Sportifs inscrits" },
              { num: "10", label: "Sports disponibles" },
              { num: "50+", label: "Villes couvertes" },
            ].map(stat => (
              <div key={stat.label} style={s.heroStat}>
                <span style={s.heroStatNum}>{stat.num}</span>
                <span style={s.heroStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.heroVisual}>
          <div style={s.heroCard}>
            <div style={s.heroCardHeader}>
              <div style={s.heroCardAvatar}>TL</div>
              <div>
                <div style={s.heroCardName}>Thomas L.</div>
                <div style={s.heroCardSport}>🎾 Tennis • Paris</div>
              </div>
              <div style={s.heroCardBadge}>Expert</div>
            </div>
            <div style={s.heroCardStars}>★★★★★</div>
            <button style={s.heroCardBtn}>💬 Contacter</button>
          </div>
          <div style={{...s.heroCard, ...s.heroCard2}}>
            <div style={s.heroCardHeader}>
              <div style={{...s.heroCardAvatar, background: "linear-gradient(135deg, #00E676, #00BCD4)"}}>SM</div>
              <div>
                <div style={s.heroCardName}>Sarah M.</div>
                <div style={s.heroCardSport}>🏃 Running • Lyon</div>
              </div>
              <div style={{...s.heroCardBadge, background: "rgba(0,230,118,0.2)", color: "#00E676"}}>Avancé</div>
            </div>
            <div style={s.heroCardStars}>★★★★☆</div>
            <button style={s.heroCardBtn}>💬 Contacter</button>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section style={s.sportsSection}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>10 sports disponibles</h2>
          <div style={s.sportsGrid}>
            {sports.map(sport => (
              <div key={sport} style={s.sportChip}>{sport}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.featuresSection}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>FONCTIONNALITÉS</div>
          <h2 style={s.sectionTitle}>Tout ce dont tu as besoin</h2>
          <p style={s.sectionDesc}>Une plateforme complète pour ta vie sportive</p>
          <div style={s.featuresGrid}>
            {features.map(f => (
              <div key={f.title} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section style={s.temoSection}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>TÉMOIGNAGES</div>
          <h2 style={s.sectionTitle}>Ils nous font confiance</h2>
          <div style={s.temoGrid}>
            {temoignages.map(t => (
              <div key={t.nom} style={s.temoCard}>
                <div style={s.temoStars}>{"★".repeat(t.note)}{"☆".repeat(5 - t.note)}</div>
                <p style={s.temoTexte}>"{t.texte}"</p>
                <div style={s.temoAuthor}>
                  <div style={s.temoAvatar}>{t.nom[0]}</div>
                  <div>
                    <div style={s.temoNom}>{t.nom}</div>
                    <div style={s.temoInfo}>{t.sport} • {t.ville}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={s.ctaSection}>
        <div style={s.ctaContent}>
          <h2 style={s.ctaTitle}>Prêt à trouver ton partenaire sportif ?</h2>
          <p style={s.ctaDesc}>Rejoins des milliers de sportifs et commence dès aujourd'hui. C'est gratuit !</p>
          <button style={s.ctaBtn} onClick={onGetStarted}>
            🚀 Créer mon compte gratuitement
          </button>
        </div>
        <div style={s.ctaDecor}/>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <span>⚡</span>
          <span style={s.navLogoText}>Sport<span style={s.navLogoAccent}>Connect</span></span>
        </div>
        <p style={s.footerText}>© 2026 SportConnect — Fait avec ❤️ pour les sportifs</p>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", overflowX: "hidden" },

  // Navbar
  navbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.25rem 3rem", position: "sticky", top: 0, zIndex: 100,
    background: "rgba(10,14,26,0.9)", backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  navLogoIcon: { fontSize: "1.5rem" },
  navLogoText: { fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: "800", color: "white" },
  navLogoAccent: { color: "var(--cyan)" },
  navCta: {
    padding: "0.6rem 1.5rem", background: "var(--blue)",
    color: "white", border: "none", borderRadius: "10px",
    fontWeight: "700", cursor: "pointer", fontSize: "0.9rem",
  },

  // Hero
  hero: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "5rem 3rem", minHeight: "90vh", position: "relative", overflow: "hidden",
    gap: "3rem",
  },
  heroDecor1: {
    position: "absolute", top: "-200px", right: "-200px",
    width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,87,255,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroDecor2: {
    position: "absolute", bottom: "-100px", left: "-100px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroContent: { flex: 1, maxWidth: "600px", position: "relative", zIndex: 1 },
  heroBadge: {
    display: "inline-block", background: "rgba(0,87,255,0.15)",
    border: "1px solid rgba(0,87,255,0.3)", color: "var(--cyan)",
    padding: "0.4rem 1rem", borderRadius: "20px",
    fontSize: "0.85rem", fontWeight: "700", marginBottom: "1.5rem",
  },
  heroTitle: {
    fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 6vw, 5.5rem)",
    fontWeight: "900", color: "white", lineHeight: "0.95",
    letterSpacing: "-2px", marginBottom: "1.5rem",
  },
  heroTitleAccent: {
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroDesc: {
    color: "var(--text2)", fontSize: "1.1rem", lineHeight: "1.7",
    marginBottom: "2rem", maxWidth: "480px",
  },
  heroBtns: { display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap" },
  heroBtnPrimary: {
    padding: "1rem 2rem", background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "1rem",
    boxShadow: "0 8px 24px rgba(0,87,255,0.3)",
  },
  heroBtnSecondary: {
    padding: "1rem 2rem", background: "rgba(255,255,255,0.05)",
    color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "1rem",
  },
  heroStats: { display: "flex", gap: "2.5rem" },
  heroStat: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  heroStatNum: {
    fontFamily: "var(--font-display)", fontSize: "2rem",
    fontWeight: "900", color: "white",
  },
  heroStatLabel: { color: "var(--text2)", fontSize: "0.8rem" },
  heroVisual: { display: "flex", flexDirection: "column", gap: "1rem", position: "relative", zIndex: 1 },
  heroCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.25rem",
    border: "1px solid rgba(255,255,255,0.08)", width: "280px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  heroCard2: { marginLeft: "2rem", marginTop: "-0.5rem" },
  heroCardHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  heroCardAvatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white", fontSize: "1rem",
  },
  heroCardName: { color: "white", fontWeight: "700", fontSize: "0.95rem" },
  heroCardSport: { color: "var(--text2)", fontSize: "0.8rem" },
  heroCardBadge: {
    marginLeft: "auto", background: "rgba(0,87,255,0.2)", color: "var(--cyan)",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  heroCardStars: { color: "#FFB300", fontSize: "1rem", marginBottom: "0.75rem" },
  heroCardBtn: {
    width: "100%", padding: "0.6rem",
    background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "8px", color: "var(--cyan)", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },

  // Sections communes
  sectionInner: { maxWidth: "1100px", margin: "0 auto", padding: "0 2rem" },
  sectionBadge: {
    display: "inline-block", background: "rgba(0,87,255,0.15)",
    border: "1px solid rgba(0,87,255,0.3)", color: "var(--cyan)",
    padding: "0.3rem 1rem", borderRadius: "20px",
    fontSize: "0.75rem", fontWeight: "700", letterSpacing: "2px",
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: "900", color: "white", marginBottom: "0.75rem",
  },
  sectionDesc: { color: "var(--text2)", fontSize: "1rem", marginBottom: "3rem" },

  // Sports
  sportsSection: {
    padding: "4rem 0", background: "var(--dark2)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  sportsGrid: { display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" },
  sportChip: {
    background: "var(--dark3)", border: "1px solid rgba(255,255,255,0.08)",
    color: "white", padding: "0.6rem 1.25rem", borderRadius: "20px",
    fontWeight: "600", fontSize: "0.95rem",
  },

  // Features
  featuresSection: { padding: "6rem 0" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" },
  featureCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.75rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  featureIcon: { fontSize: "2.5rem", marginBottom: "1rem" },
  featureTitle: { color: "white", fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.5rem" },
  featureDesc: { color: "var(--text2)", fontSize: "0.9rem", lineHeight: "1.6" },

  // Témoignages
  temoSection: {
    padding: "6rem 0", background: "var(--dark2)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  temoGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" },
  temoCard: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.75rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  temoStars: { color: "#FFB300", fontSize: "1.1rem", marginBottom: "1rem" },
  temoTexte: { color: "var(--text2)", fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "1.5rem", fontStyle: "italic" },
  temoAuthor: { display: "flex", alignItems: "center", gap: "0.75rem" },
  temoAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
  },
  temoNom: { color: "white", fontWeight: "700", fontSize: "0.9rem" },
  temoInfo: { color: "var(--text2)", fontSize: "0.8rem" },

  // CTA
  ctaSection: {
    padding: "6rem 3rem", textAlign: "center",
    background: "linear-gradient(135deg, rgba(0,87,255,0.15) 0%, rgba(0,229,255,0.05) 100%)",
    borderTop: "1px solid rgba(0,87,255,0.2)",
    position: "relative", overflow: "hidden",
  },
  ctaContent: { position: "relative", zIndex: 1 },
  ctaTitle: {
    fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)",
    fontWeight: "900", color: "white", marginBottom: "1rem",
  },
  ctaDesc: { color: "var(--text2)", fontSize: "1.1rem", marginBottom: "2rem" },
  ctaBtn: {
    padding: "1.1rem 2.5rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "14px",
    fontWeight: "700", cursor: "pointer", fontSize: "1.1rem",
    boxShadow: "0 8px 32px rgba(0,87,255,0.4)",
  },
  ctaDecor: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,87,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  // Footer
  footer: {
    padding: "2rem 3rem", background: "var(--dark2)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  footerLogo: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem" },
  footerText: { color: "var(--text2)", fontSize: "0.85rem" },
};
