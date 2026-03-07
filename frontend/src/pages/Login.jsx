import { useState, useEffect } from "react";

export default function Login({ onLogin, onBack, verifyMsg }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", nom: "", prenom: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [code2fa, setCode2fa] = useState("");
  const [pendingLogin, setPendingLogin] = useState(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    // Message vérification email venant de App.jsx
    if (verifyMsg) {
      if (verifyMsg.toLowerCase().includes("succès") || verifyMsg.toLowerCase().includes("vérifié")) {
        setSuccess("✅ " + verifyMsg);
      } else {
        setError(verifyMsg);
      }
    }

    // Reset mot de passe
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    if (reset) {
      setResetToken(reset);
      setResetMode(true);
      window.history.replaceState({}, "", "/");
    }
  }, [verifyMsg]);

  async function handleSubmit() {
    setError(""); setSuccess(""); setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, nom: form.nom, prenom: form.prenom };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.emailNotVerified) {
          setError("📧 " + data.error);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setPendingLogin({ email: form.email, password: form.password });
        setSuccess("📧 Code envoyé par email ! Valable 10 minutes.");
        return;
      }

      if (data.emailVerificationRequired) {
        setSuccess("✅ Compte créé ! Vérifie ton email pour activer ton compte.");
        setMode("login");
        return;
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingLogin, code2fa }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code invalide");
        return;
      }
      onLogin(data.token, data.user);
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("✅ Mot de passe mis à jour ! Tu peux te connecter.");
      setResetMode(false);
    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      setSuccess(data.message || "Email envoyé !");
    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  // Vue reset mot de passe
  if (resetMode) {
    return (
      <div style={s.page}>
        <div style={s.card} className="fade-in">
          <div style={s.logo}><span>⚡</span><span style={s.logoAccent}>SportConnect</span></div>
          <h2 style={s.title}>🔒 Nouveau mot de passe</h2>
          <p style={s.subtitle}>Choisis un nouveau mot de passe sécurisé</p>
          {error && <div style={s.error}>{error}</div>}
          {success && <div style={s.successMsg}>{success}</div>}
          <div style={s.field}>
            <label style={s.label}>Nouveau mot de passe</label>
            <input style={s.input} type="password"
              placeholder="Minimum 8 caractères, 1 majuscule, 1 chiffre"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()} />
          </div>
          <div style={s.passwordRules}>
            <span style={newPassword.length >= 8 ? s.ruleOk : s.ruleKo}>✓ 8 caractères minimum</span>
            <span style={/[A-Z]/.test(newPassword) ? s.ruleOk : s.ruleKo}>✓ 1 majuscule</span>
            <span style={/[0-9]/.test(newPassword) ? s.ruleOk : s.ruleKo}>✓ 1 chiffre</span>
          </div>
          <button style={s.btn} onClick={handleReset} disabled={loading}>
            {loading ? "Mise à jour..." : "✓ Mettre à jour"}
          </button>
        </div>
      </div>
    );
  }

  // Vue 2FA
  if (requires2FA) {
    return (
      <div style={s.page}>
        <div style={s.card} className="fade-in">
          <div style={s.logo}><span>⚡</span><span style={s.logoAccent}>SportConnect</span></div>
          <div style={s.twoFAIcon}>🔐</div>
          <h2 style={s.title}>Vérification en 2 étapes</h2>
          <p style={s.subtitle}>Un code a été envoyé à <strong>{pendingLogin?.email}</strong></p>
          {error && <div style={s.error}>{error}</div>}
          {success && <div style={s.successMsg}>{success}</div>}
          <div style={s.field}>
            <label style={s.label}>Code de vérification</label>
            <input style={{...s.input, ...s.codeInput}}
              placeholder="000000"
              value={code2fa}
              maxLength={6}
              onChange={e => setCode2fa(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handle2FA()} />
          </div>
          <button style={s.btn} onClick={handle2FA} disabled={loading || code2fa.length !== 6}>
            {loading ? "Vérification..." : "✓ Confirmer"}
          </button>
          <button style={s.linkBtn} onClick={() => { setRequires2FA(false); setCode2fa(""); }}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-in">
        <div style={s.logo}>
          <span>⚡</span>
          <span style={s.logoAccent}>SportConnect</span>
        </div>

        <div style={s.tabs}>
          <button style={{...s.tab, ...(mode === "login" ? s.tabActive : {})}}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
            Connexion
          </button>
          <button style={{...s.tab, ...(mode === "register" ? s.tabActive : {})}}
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
            Inscription
          </button>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.successMsg}>{success}</div>}

        {mode === "register" && (
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Prénom *</label>
              <input style={s.input} placeholder="Jean"
                value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Nom *</label>
              <input style={s.input} placeholder="Dupont"
                value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
            </div>
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>Email *</label>
          <input style={s.input} type="email" placeholder="ton@email.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Mot de passe *</label>
          <input style={s.input} type="password"
            placeholder={mode === "register" ? "Min. 8 car., 1 majuscule, 1 chiffre" : "Ton mot de passe"}
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {mode === "register" && form.password && (
          <div style={s.passwordRules}>
            <span style={form.password.length >= 8 ? s.ruleOk : s.ruleKo}>✓ 8 caractères minimum</span>
            <span style={/[A-Z]/.test(form.password) ? s.ruleOk : s.ruleKo}>✓ 1 majuscule</span>
            <span style={/[0-9]/.test(form.password) ? s.ruleOk : s.ruleKo}>✓ 1 chiffre</span>
          </div>
        )}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Chargement..." : mode === "login" ? "→ Se connecter" : "✓ Créer mon compte"}
        </button>

        {mode === "login" && (
          <button style={s.linkBtn} onClick={handleForgot}>
            🔒 Mot de passe oublié ?
          </button>
        )}

        <div style={s.divider}><span style={s.dividerText}>ou</span></div>

        <a href="/api/auth/google" style={s.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuer avec Google
        </a>

        {onBack && (
          <button style={s.backBtn} onClick={onBack}>← Retour à l'accueil</button>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "1rem",
    background: "var(--dark)",
  },
  card: {
    background: "var(--dark3)", borderRadius: "24px", padding: "2.5rem",
    width: "100%", maxWidth: "440px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "0.5rem", marginBottom: "2rem", fontSize: "1.5rem",
  },
  logoAccent: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "var(--cyan)",
  },
  twoFAIcon: { textAlign: "center", fontSize: "3rem", marginBottom: "1rem" },
  title: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "white", textAlign: "center", marginBottom: "0.5rem",
  },
  subtitle: { color: "var(--text2)", textAlign: "center", fontSize: "0.9rem", marginBottom: "1.5rem" },
  tabs: {
    display: "flex", background: "var(--dark4)", borderRadius: "12px",
    padding: "4px", marginBottom: "1.5rem", gap: "4px",
  },
  tab: {
    flex: 1, padding: "0.65rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  tabActive: { background: "var(--blue)", color: "white" },
  error: {
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    color: "#FF3D57", padding: "0.75rem 1rem", borderRadius: "10px",
    fontSize: "0.85rem", marginBottom: "1rem",
  },
  successMsg: {
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem 1rem", borderRadius: "10px",
    fontSize: "0.85rem", marginBottom: "1rem",
  },
  row: { display: "flex", gap: "0.75rem" },
  field: { marginBottom: "1rem", flex: 1 },
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
  },
  input: {
    width: "100%", padding: "0.85rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem",
    outline: "none", boxSizing: "border-box",
  },
  codeInput: {
    fontSize: "1.8rem", textAlign: "center", letterSpacing: "8px",
    fontFamily: "var(--font-display)", fontWeight: "900",
  },
  passwordRules: {
    display: "flex", gap: "0.75rem", flexWrap: "wrap",
    marginBottom: "1rem", marginTop: "-0.5rem",
  },
  ruleOk: { color: "#00E676", fontSize: "0.75rem", fontWeight: "600" },
  ruleKo: { color: "var(--text2)", fontSize: "0.75rem" },
  btn: {
    width: "100%", padding: "0.95rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontSize: "1rem", fontWeight: "700", cursor: "pointer",
    marginBottom: "0.75rem",
  },
  linkBtn: {
    width: "100%", padding: "0.6rem", background: "transparent",
    border: "none", color: "var(--text2)", cursor: "pointer",
    fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem",
  },
  divider: {
    display: "flex", alignItems: "center", gap: "1rem",
    margin: "1rem 0",
  },
  dividerText: {
    color: "var(--text2)", fontSize: "0.8rem", padding: "0 0.5rem",
    background: "var(--dark3)",
  },
  googleBtn: {
    width: "100%", padding: "0.85rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
    color: "white", fontWeight: "600", fontSize: "0.9rem",
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "0.75rem", textDecoration: "none",
    marginBottom: "1rem",
  },
  backBtn: {
    width: "100%", padding: "0.6rem", background: "transparent",
    border: "none", color: "var(--text2)", cursor: "pointer",
    fontSize: "0.85rem", marginTop: "0.5rem",
  },
};
