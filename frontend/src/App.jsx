import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Récupère le token Google OAuth depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("token");
    const googleUser = params.get("user");

    if (googleToken && googleUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(googleUser));
        localStorage.setItem("token", googleToken);
        localStorage.setItem("user", JSON.stringify(parsedUser));
        setToken(googleToken);
        setUser(parsedUser);
        // Nettoie l'URL
        window.history.replaceState({}, "", "/");
      } catch (e) {
        console.error("Erreur parsing user Google", e);
      }
    }

    // Gère l'erreur Google
    const error = params.get("error");
    if (error === "google") {
      setShowLogin(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function handleLogin(newToken, newUser) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setShowLogin(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setShowLogin(false);
  }

  if (token) return <Dashboard token={token} user={user} onLogout={handleLogout} />;
  if (showLogin) return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
  return <Landing onGetStarted={() => setShowLogin(true)} />;
}
