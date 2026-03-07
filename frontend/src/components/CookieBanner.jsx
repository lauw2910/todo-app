import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function acceptAll() {
    localStorage.setItem("cookie_consent", JSON.stringify({
      analytics: true, marketing: true, date: new Date().toISOString()
    }));
    setVisible(false);
  }

  function refuseAll() {
    localStorage.setItem("cookie_consent", JSON.stringify({
      analytics: false, marketing: false, date: new Date().toISOString()
    }));
    setVisible(false);
  }

  function savePrefs() {
    localStorage.setItem("cookie_consent", JSON.stringify({
      ...prefs, date: new Date().toISOString()
    }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={s.overlay}>
      <div style={s.banner}>
        <div style={s.bannerTop}>
          <div style={s.bannerIcon}>🍪</div>
          <div style={s.bannerContent}>
            <h3 style={s.bannerTitle}>Nous utilisons des cookies</h3>
            <p style={s.bannerText}>
              SportConnect utilise des cookies pour assurer le bon fonctionnement du site.
              Certains cookies sont nécessaires, d'autres nous aident à améliorer votre expérience.
              Consultez notre{" "}
              <a href="/politique-confidentialite" style={s.link} target="_blank">
                politique de confidentialité
              </a>.
            </p>
          </div>
        </div>

        {showDetails && (
          <div style={s.details}>
            <div style={s.cookieItem}>
              <div>
                <div style={s.cookieName}>🔒 Cookies essentiels</div>
                <div style={s.cookieDesc}>Authentification, sécurité. Toujours actifs.</div>
              </div>
              <div style={s.cookieToggleOn}>Toujours actif</div>
            </div>
            <div style={s.cookieItem}>
              <div>
                <div style={s.cookieName}>📊 Cookies analytiques</div>
                <div style={s.cookieDesc}>Nous aident à comprendre comment vous utilisez le site.</div>
              </div>
              <div style={s.toggle} onClick={() => setPrefs(p => ({...p, analytics: !p.analytics}))}>
                <div style={{...s.toggleThumb, ...(prefs.analytics ? s.toggleOn : {})}}/>
              </div>
            </div>
            <div style={s.cookieItem}>
              <div>
                <div style={s.cookieName}>📣 Cookies marketing</div>
                <div style={s.cookieDesc}>Permettent de vous proposer du contenu personnalisé.</div>
              </div>
              <div style={s.toggle} onClick={() => setPrefs(p => ({...p, marketing: !p.marketing}))}>
                <div style={{...s.toggleThumb, ...(prefs.marketing ? s.toggleOn : {})}}/>
              </div>
            </div>
          </div>
        )}

        <div style={s.bannerBtns}>
          <button style={s.detailsBtn} onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Masquer les détails" : "Personnaliser"}
          </button>
          {showDetails && (
            <button style={s.saveBtn} onClick={savePrefs}>
              Sauvegarder mes choix
            </button>
          )}
          <button style={s.refuseBtn} onClick={refuseAll}>
            Refuser
          </button>
          <button style={s.acceptBtn} onClick={acceptAll}>
            ✓ Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
    padding: "1rem",
    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
  },
  banner: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(0,87,255,0.3)",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
    maxWidth: "800px", margin: "0 auto",
  },
  bannerTop: { display: "flex", gap: "1rem", marginBottom: "1rem" },
  bannerIcon: { fontSize: "2rem", flexShrink: 0 },
  bannerContent: { flex: 1 },
  bannerTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  bannerText: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.6" },
  link: { color: "var(--cyan)", textDecoration: "underline" },
  details: {
    background: "var(--dark4)", borderRadius: "12px", padding: "1rem",
    marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem",
  },
  cookieItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: "1rem",
  },
  cookieName: { color: "white", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.2rem" },
  cookieDesc: { color: "var(--text2)", fontSize: "0.8rem" },
  cookieToggleOn: {
    color: "#00E676", fontSize: "0.75rem", fontWeight: "700",
    background: "rgba(0,230,118,0.1)", padding: "0.3rem 0.75rem",
    borderRadius: "20px", whiteSpace: "nowrap",
  },
  toggle: {
    width: "44px", height: "24px", borderRadius: "12px",
    background: "var(--dark3)", border: "2px solid rgba(255,255,255,0.1)",
    cursor: "pointer", position: "relative", flexShrink: 0,
    transition: "background 0.2s",
  },
  toggleThumb: {
    position: "absolute", top: "2px", left: "2px",
    width: "16px", height: "16px", borderRadius: "50%",
    background: "var(--text2)", transition: "all 0.2s",
  },
  toggleOn: {
    left: "22px", background: "#00E676",
  },
  bannerBtns: {
    display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end",
  },
  detailsBtn: {
    padding: "0.6rem 1rem", background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    color: "var(--text2)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
  },
  saveBtn: {
    padding: "0.6rem 1rem", background: "rgba(0,87,255,0.1)",
    border: "1px solid rgba(0,87,255,0.3)", borderRadius: "8px",
    color: "var(--cyan)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
  },
  refuseBtn: {
    padding: "0.6rem 1rem", background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    color: "var(--text2)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
  },
  acceptBtn: {
    padding: "0.6rem 1.25rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "8px",
    fontWeight: "700", cursor: "pointer", fontSize: "0.85rem",
  },
};
