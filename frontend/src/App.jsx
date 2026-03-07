import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import CookieBanner from "./components/CookieBanner";
import Confidentialite from "./pages/Confidentialite";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [showLogin, setShowLogin] = useState(false);
  const [showConfidentialite, setShowConfidentialite] = useState(false);
  const [confidentialiteTab, setConfidentialiteTab] = useState("cgu");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Vérification email
    const verifyToken = params.get("verify");
    if (verifyToken) {
      setVerifying(true);
      fetch(`/api/auth/verify-email?token=${verifyToken}`)
        .then(res => res.json())
        .then(data => {
          window.history.replaceState({}, "", "/");
          const currentToken = localStorage.getItem("token");
          const currentUser = JSON.parse(localStorage.getItem("user") || "null");
          if (data.message) {
            if (currentToken && currentUser) {
              const updatedUser = { ...currentUser, email_verifie: true };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
              setVerifying(false);
              alert("✅ Email vérifié avec succès !");
              window.location.reload();
            } else {
              setVerifyMsg(data.message);
              setShowLogin(true);
              setVerifying(false);
            }
          } else {
            setVerifyMsg(data.error || "Lien invalide ou expiré");
            setShowLogin(true);
            setVerifying(false);
          }
        });
      return;
    }

    // Reset mot de passe
    const reset = params.get("reset");
    if (reset) {
      setShowLogin(true);
      return;
    }

    // Google OAuth
    const googleToken = params.get("token");
    const googleUser = params.get("user");
    if (googleToken && googleUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(googleUser));
        localStorage.setItem("token", googleToken);
        localStorage.setItem("user", JSON.stringify(parsedUser));
        setToken(googleToken);
        setUser(parsedUser);
        window.history.replaceState({}, "", "/");
      } catch (e) {
        console.error("Erreur parsing user Google", e);
      }
    }

    const error = params.get("error");
    if (error === "google") {
      setShowLogin(true);
      window.history.replaceState({}, "", "/");
    }

    // Liens légaux depuis l'URL
    const page = params.get("page");
    if (page === "confidentialite") {
      setConfidentialiteTab("confidentialite");
      setShowConfidentialite(true);
      window.history.replaceState({}, "", "/");
    }
    if (page === "cgu") {
      setConfidentialiteTab("cgu");
      setShowConfidentialite(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function handleLogin(newToken, newUser) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setShowLogin(false);
    setVerifyMsg("");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setShowLogin(false);
    setVerifyMsg("");
  }

  // Écran de vérification email en cours
  if (verifying) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--dark)", gap: "1rem",
      }}>
        <div style={{
          width: "50px", height: "50px", borderRadius: "50%",
          border: "4px solid var(--dark3)", borderTopColor: "var(--blue)",
          animation: "spin 0.8s linear infinite",
        }}/>
        <p style={{ color: "var(--text2)", fontSize: "1rem" }}>
          Vérification de ton email...
        </p>
      </div>
    );
  }

  return (
    <>
      {token
        ? <Dashboard token={token} user={user} onLogout={handleLogout}
            onShowLegal={(tab) => { setConfidentialiteTab(tab); setShowConfidentialite(true); }} />
        : showLogin
          ? <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} verifyMsg={verifyMsg} />
          : <Landing onGetStarted={() => setShowLogin(true)}
              onShowLegal={(tab) => { setConfidentialiteTab(tab); setShowConfidentialite(true); }} />
      }

      <CookieBanner />

      {showConfidentialite && (
        <Confidentialite
          token={token}
          initialTab={confidentialiteTab}
          onClose={() => setShowConfidentialite(false)}
        />
      )}
    </>
  );
}
