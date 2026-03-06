import { useState, useEffect } from "react";

export default function Login({ onLogin, onBack }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", nom: "", prenom: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) {
      setResetToken(token);
      setResetMode(true);
    }
  }, []);

  async function handleSubmit() {
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Adresse email invalide");
      return;
    }

    if (tab === "register") {
      if (form.password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }
      if (!/[A-Z]/.test(form.password)) {
        setError("Le mot de passe doit contenir au moins une majuscule");
        return;
      }
      if (!/[0-9]/.test(form.password)) {
        setError("Le mot de passe doit contenir au moins un chiffre");
        return;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
        setError("Le mot de passe doit contenir au moins un caractère spécial");
        return;
      }
      if (!form.prenom.trim()) {
        setError("Le prénom est requis");
        return;
      }
      if (!form.nom.trim()) {
        setError("Le nom est requis");
        return;
      }
    }

    setLoading(true);
    const url = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = tab === "login"
      ? { email: form.email, password: form.password }
      : form;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      onLogin(data.token, data.user);
    } catch {
      setError("Erreur de connexion");
    }
    setLoading(false);
  }

  async function handleForgot() {
    setForgotMsg(""); setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json();
    setForgotMsg(data.message);
    setLoading(false);
  }

  async function handleReset() {
    setResetMsg(""); setLoading(true);
    if (resetPassword !== resetConfirm) {
      setResetMsg("Les mots de passe ne correspondent pas");
      setLoading(false); return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setResetMsg("✅ Mot de passe mis à jour ! Tu peux te connecter.");
      setTimeout(() => {
        setResetMode(false);
        window.history.replaceState({}, "", "/");
      }, 2000);
    } else {
      setResetMsg("❌ " + data.error);
    }
    setLoading(false);
  }

  const passwordHints = [
    { test: form.password.length >= 8, label: "8 caractères minimum" },
    { test: /[A-Z]/.test(form.password), label: "1 majuscule" },
    { test: /[0-9]/.test(form.password), label: "1 chiffre" },
    { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), label: "1 caractère spécial" },
  ];

  // Page reset mot de passe
  if (resetMode) {
    return (
      <div style={s.page}>
        <div style={s.card} className="fade-in">
          <div style={s.logo}>
            <span>⚡</span>
            <span style={s.logoText}>Sport<span style={s.logoAccent}>Connect</span></span>
          </div>
          <h2 style={s.title}>🔒 Nouveau mot de passe</h2>
          <p style={s.sub}>Choisis un nouveau mot de passe sécurisé</p>
          <div style={s.field}>
            <label style={s.label}>Nouveau mot de passe</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirmer le mot de passe</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()} />
          </div>
          {resetMsg && (
            <div style={resetMsg.includes("✅") ? s.successMsg : s.errorMsg}>{resetMsg}</div>
          )}
          <button style={s.submitBtn} onClick={handleReset} disabled={loading}>
            {loading ? "Mise à jour..." : "✓ Mettre à jour"}
          </button>
        </div>
      </div>
    );
  }

  // Page mot de passe oublié
  if (forgotMode) {
    return (
      <div style={s.page}>
        <div style={s.card} className="fade-in">
          <div style={s.logo}>
            <span>⚡</span>
            <span style={s.logoText}>Sport<span style={s.logoAccent}>Connect</span></span>
          </div>
          <h2 style={s.title}>🔑 Mot de passe oublié</h2>
          <p style={s.sub}>Entre ton email pour recevoir un lien de réinitialisation</p>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="ton@email.com"
              value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleForgot()} />
          </div>
          {forgotMsg && <div style={s.successMsg}>✅ {forgotMsg}</div>}
          <button style={s.submitBtn} onClick={handleForgot} disabled={loading}>
            {loading ? "Envoi..." : "📧 Envoyer le lien"}
          </button>
          <button style={s.backBtn} onClick={() => setForgotMode(false)}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Page login / register
  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftDecor1}/>
        <div style={s.leftDecor2}/>
        <div style={s.leftContent}>
          <div style={s.logo}>
            <span style={{fontSize: "2.5rem"}}>⚡</span>
            <span style={{...s.logoText, fontSize: "2.5rem"}}>Sport<span style={s.logoAccent}>Connect</span></span>
          </div>
          <h1 style={s.leftTitle}>Trouve ton partenaire sportif idéal</h1>
          <p style={s.leftDesc}>Rejoins des milliers de sportifs et trouve des partenaires près de chez toi.</p>
          <div style={s.leftStats}>
            {[
              { num: "2 400+", label: "Sportifs" },
              { num: "10", label: "Sports" },
              { num: "50+", label: "Villes" },
            ].map(stat => (
              <div key={stat.label} style={s.leftStat}>
                <span style={s.leftStatNum}>{stat.num}</span>
                <span style={s.leftStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
          {onBack && (
            <button style={s.backToLanding} onClick={onBack}>← Retour à l'accueil</button>
          )}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card} className="fade-in">
          <div style={s.tabs}>
            <button style={{...s.tabBtn, ...(tab === "login" ? s.tabBtnActive : {})}}
              onClick={() => setTab("login")}>Connexion</button>
            <button style={{...s.tabBtn, ...(tab === "register" ? s.tabBtnActive : {})}}
              onClick={() => setTab("register")}>Inscription</button>
          </div>

          {tab === "register" && (
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Prénom</label>
                <input style={s.input} placeholder="John"
                  value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Nom</label>
                <input style={s.input} placeholder="Doe"
                  value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
              </div>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="ton@email.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {tab === "register" && form.password.length > 0 && (
            <div style={s.passwordHints}>
              {passwordHints.map(hint => (
                <span key={hint.label} style={{...s.hint, color: hint.test ? "#00E676" : "#FF3D57"}}>
                  {hint.test ? "✓" : "✗"} {hint.label}
                </span>
              ))}
            </div>
          )}

          {tab === "login" && (
            <button style={s.forgotLink} onClick={() => setForgotMode(true)}>
              Mot de passe oublié ?
            </button>
          )}

          {error && <div style={s.errorMsg}>❌ {error}</div>}

          <button style={s.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Chargement..." : tab === "login" ? "→ Se connecter" : "→ Créer mon compte"}
          </button>

          <div style={s.divider}>
            <span style={s.dividerLine}/>
            <span style={s.dividerText}>ou</span>
            <span style={s.dividerLine}/>
          </div>

          <a href="/api/auth/google" style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </a>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex", minHeight: "100vh",
    alignItems: "center", justifyContent: "center",
  },
  left: {
    flex: 1, minHeight: "100vh", padding: "3rem",
    background: "linear-gradient(135deg, var(--dark2), var(--dark3))",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
  },
  leftDecor1: {
    position: "absolute", top: "-100px", right: "-100px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,87,255,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  leftDecor2: {
    position: "absolute", bottom: "-100px", left: "-100px",
    width: "300px", height: "300px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  leftContent: { position: "relative", zIndex: 1, maxWidth: "480px" },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" },
  logoText: { fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: "800", color: "white" },
  logoAccent: { color: "var(--cyan)" },
  leftTitle: {
    fontFamily: "var(--font-display)", fontSize: "3rem",
    fontWeight: "900", color: "white", lineHeight: "1.1",
    letterSpacing: "-1px", marginBottom: "1rem",
  },
  leftDesc: { color: "var(--text2)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "2.5rem" },
  leftStats: { display: "flex", gap: "2rem", marginBottom: "2rem" },
  leftStat: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  leftStatNum: {
    fontFamily: "var(--font-display)", fontSize: "2rem",
    fontWeight: "900", color: "var(--cyan)",
  },
  leftStatLabel: { color: "var(--text2)", fontSize: "0.8rem" },
  backToLanding: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text2)", padding: "0.6rem 1.25rem", borderRadius: "10px",
    cursor: "pointer", fontSize: "0.9rem", fontWeight: "600",
  },
  right: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "2rem", minHeight: "100vh", background: "var(--dark)",
  },
  card: {
    width: "100%", maxWidth: "420px",
    background: "var(--dark3)", borderRadius: "20px", padding: "2rem",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "900", color: "white", marginBottom: "0.5rem",
  },
  sub: { color: "var(--text2)", fontSize: "0.9rem", marginBottom: "1.5rem" },
  tabs: {
    display: "flex", background: "var(--dark4)",
    borderRadius: "12px", padding: "4px", marginBottom: "1.5rem",
  },
  tabBtn: {
    flex: 1, padding: "0.65rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s",
  },
  tabBtnActive: { background: "var(--blue)", color: "white" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  field: { marginBottom: "1rem" },
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
  },
  input: {
    width: "100%", padding: "0.85rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
  },
  passwordHints: {
    display: "flex", flexWrap: "wrap", gap: "0.5rem",
    marginBottom: "1rem", marginTop: "-0.5rem",
  },
  hint: { fontSize: "0.78rem", fontWeight: "600" },
  forgotLink: {
    background: "none", border: "none", color: "var(--cyan)",
    cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
    marginBottom: "1rem", padding: 0, display: "block",
  },
  errorMsg: {
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    color: "#FF3D57", padding: "0.75rem 1rem", borderRadius: "10px",
    marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600",
  },
  successMsg: {
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem 1rem", borderRadius: "10px",
    marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600",
  },
  submitBtn: {
    width: "100%", padding: "1rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontSize: "1rem", fontWeight: "700", cursor: "pointer", marginBottom: "0.5rem",
  },
  backBtn: {
    width: "100%", padding: "0.75rem", background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600",
  },
  divider: {
    display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0",
  },
  dividerLine: {
    flex: 1, height: "1px", background: "rgba(255,255,255,0.1)",
  },
  dividerText: { color: "var(--text2)", fontSize: "0.8rem" },
  googleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
    width: "100%", padding: "0.85rem",
    background: "white", color: "#333",
    border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "0.95rem",
    textDecoration: "none", boxSizing: "border-box",
  },
};
