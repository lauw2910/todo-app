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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Vérification email — fonctionne même si connecté
    const verifyToken = params.get("verify");
    if (verifyToken) {
      fetch(`/api/auth/verify-email?token=${verifyToken}`)
        .then(res => res.json())
        .then(data => {
          window.history.replaceState({}, "", "/");
          if (data.message) {
            const currentToken = localStorage.getItem("token");
            const currentUser = JSON.parse(localStorage.getItem("user") || "null");
            if (currentToken && currentUser) {
              // Connecté → met à jour le user
              const updatedUser = { ...currentUser, email_verifie: true };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
              alert("✅ Email vérifié avec succès !");
              window.location.reload();
            } else {
              // Pas connecté → affiche login avec message
              setVerifyMsg(data.message);
              setShowLogin(true);
            }
          } else {
            setVerifyMsg(data.error || "Lien invalide ou expiré");
            setShowLogin(true);
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
