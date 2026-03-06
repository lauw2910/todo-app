import { useState, useEffect, useRef } from "react";
import VilleInput from "../components/VilleInput";

export default function Profil({ token }) {
  const [profil, setProfil] = useState(null);
  const [sports, setSports] = useState([]);
  const [sportsFavoris, setSportsFavoris] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchProfil();
    fetchSports();
  }, []);

  async function fetchProfil() {
    const res = await fetch("/api/profil", { headers });
    const data = await res.json();
    setProfil(data);
    setSportsFavoris(data.sports?.map(s => s.id) || []);
    setLoading(false);
  }

  async function fetchSports() {
    const res = await fetch("/api/profil/sports", { headers });
    const data = await res.json();
    setSports(data);
  }

  async function saveProfil() {
    setMessage("");
    await fetch("/api/profil", { method: "PUT", headers, body: JSON.stringify(profil) });
    await fetch("/api/profil/sports", { method: "PUT", headers, body: JSON.stringify({ sportIds: sportsFavoris }) });
    setMessage("Profil sauvegardé avec succès !");
    setTimeout(() => setMessage(""), 3000);
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/profil/photo", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setProfil(prev => ({ ...prev, photo: data.photo }));
      setMessage("Photo mise à jour !");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Erreur : " + data.error);
    }
    setUploadingPhoto(false);
  }

  function toggleSport(id) {
    setSportsFavoris(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  if (loading) return (
    <div style={s.loading}>
      <div style={s.loadingSpinner}/>
      <p>Chargement...</p>
    </div>
  );

  const niveaux = [
    { id: "debutant", label: "Débutant", icon: "🌱" },
    { id: "intermediaire", label: "Intermédiaire", icon: "⚡" },
    { id: "avance", label: "Avancé", icon: "🔥" },
    { id: "expert", label: "Expert", icon: "👑" },
  ];

  return (
    <div style={s.container} className="fade-in">
      <div style={s.header}>
        <div style={s.avatarWrapper}>
          <div style={s.avatar} onClick={() => fileInputRef.current?.click()}>
            {profil?.photo ? (
              <img src={profil.photo} alt="photo" style={s.avatarImg} />
            ) : (
              <span>{profil?.prenom?.[0]?.toUpperCase()}{profil?.nom?.[0]?.toUpperCase()}</span>
            )}
            <div style={s.avatarOverlay}>
              {uploadingPhoto ? "⏳" : "📷"}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={uploadPhoto} />
          <p style={s.avatarHint}>Clique pour changer</p>
        </div>

        <div>
          <h1 style={s.title}>{profil?.prenom} {profil?.nom}</h1>
          <p style={s.subtitle}>{profil?.email}</p>
          <div style={s.levelBadge}>
            {niveaux.find(n => n.id === profil?.niveau)?.icon} {profil?.niveau}
          </div>
        </div>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <span style={s.cardTitleIcon}>👤</span>
            Informations personnelles
          </h3>
          <div style={s.fields}>
            {[
              { key: "prenom", label: "Prénom", placeholder: "John" },
              { key: "nom", label: "Nom", placeholder: "Doe" },
              { key: "age", label: "Âge", placeholder: "25", type: "number" },
            ].map(field => (
              <div key={field.key} style={s.field}>
                <label style={s.label}>{field.label}</label>
                <input style={s.input} type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={profil?.[field.key] || ""}
                  onChange={e => setProfil({ ...profil, [field.key]: e.target.value })} />
              </div>
            ))}
            <div style={s.field}>
              <label style={s.label}>Ville</label>
              <VilleInput
                style={s.input}
                value={profil?.ville || ""}
                onChange={val => setProfil({ ...profil, ville: val })}
              />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <span style={s.cardTitleIcon}>🏆</span>
            Niveau général
          </h3>
          <div style={s.niveaux}>
            {niveaux.map(n => (
              <button key={n.id}
                style={{...s.niveauBtn, ...(profil?.niveau === n.id ? s.niveauBtnActive : {})}}
                onClick={() => setProfil({ ...profil, niveau: n.id })}>
                <span style={s.niveauIcon}>{n.icon}</span>
                <span style={s.niveauLabel}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>
          <span style={s.cardTitleIcon}>🏅</span>
          Mes sports favoris
          <span style={s.cardBadge}>{sportsFavoris.length} sélectionné{sportsFavoris.length > 1 ? "s" : ""}</span>
        </h3>
        <div style={s.sportsGrid}>
          {sports.map(sport => (
            <div key={sport.id}
              style={{...s.sportBtn, ...(sportsFavoris.includes(sport.id) ? s.sportBtnActive : {})}}
              onClick={() => toggleSport(sport.id)}>
              <span style={s.sportIcon}>{sport.icone}</span>
              <span style={s.sportNom}>{sport.nom}</span>
              {sportsFavoris.includes(sport.id) && <span style={s.sportCheck}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div style={message.includes("Erreur") ? s.errorMsg : s.successMsg}>
          {message.includes("Erreur") ? "❌" : "✅"} {message}
        </div>
      )}

      <button style={s.saveBtn} onClick={saveProfil}>
        💾 Sauvegarder mon profil
      </button>
    </div>
  );
}

const s = {
  container: { maxWidth: "900px", margin: "0 auto" },
  loading: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "60vh", color: "var(--text2)", gap: "1rem",
  },
  loadingSpinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex", alignItems: "center", gap: "1.5rem",
    background: "linear-gradient(135deg, var(--dark3), var(--dark4))",
    borderRadius: "20px", padding: "2rem",
    border: "1px solid rgba(0,87,255,0.2)", marginBottom: "1.5rem",
  },
  avatarWrapper: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" },
  avatar: {
    width: "90px", height: "90px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: "900",
    color: "white", flexShrink: 0, cursor: "pointer", position: "relative",
    overflow: "hidden", border: "3px solid rgba(0,87,255,0.3)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarOverlay: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.5rem", opacity: 0, transition: "opacity 0.2s",
  },
  avatarHint: { color: "var(--text2)", fontSize: "0.75rem", textAlign: "center" },
  title: {
    fontFamily: "var(--font-display)", fontSize: "2rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  subtitle: { color: "var(--text2)", fontSize: "0.9rem", marginBottom: "0.5rem" },
  levelBadge: {
    display: "inline-block", background: "rgba(0,87,255,0.2)",
    border: "1px solid rgba(0,87,255,0.3)", color: "var(--cyan)",
    padding: "0.25rem 0.75rem", borderRadius: "20px",
    fontSize: "0.8rem", fontWeight: "700", textTransform: "capitalize",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.5rem",
  },
  cardTitle: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    fontFamily: "var(--font-display)", fontSize: "1.1rem",
    fontWeight: "800", color: "white", marginBottom: "1.25rem",
  },
  cardTitleIcon: { fontSize: "1.2rem" },
  cardBadge: {
    marginLeft: "auto", background: "rgba(0,87,255,0.2)",
    color: "var(--cyan)", padding: "0.2rem 0.6rem",
    borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  fields: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  field: {},
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
  },
  niveaux: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  niveauBtn: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.85rem", border: "2px solid rgba(255,255,255,0.08)",
    borderRadius: "12px", background: "var(--dark4)",
    color: "var(--text2)", cursor: "pointer", transition: "all 0.2s",
  },
  niveauBtnActive: {
    border: "2px solid var(--blue)", background: "rgba(0,87,255,0.15)", color: "white",
  },
  niveauIcon: { fontSize: "1.2rem" },
  niveauLabel: { fontWeight: "600", fontSize: "0.9rem" },
  sportsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" },
  sportBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
    padding: "1rem 0.5rem", border: "2px solid rgba(255,255,255,0.05)",
    borderRadius: "12px", background: "var(--dark4)",
    cursor: "pointer", transition: "all 0.2s", position: "relative",
  },
  sportBtnActive: { border: "2px solid var(--blue)", background: "rgba(0,87,255,0.15)" },
  sportIcon: { fontSize: "1.8rem" },
  sportNom: { color: "var(--text2)", fontSize: "0.75rem", fontWeight: "600", textAlign: "center" },
  sportCheck: {
    position: "absolute", top: "6px", right: "6px",
    background: "var(--blue)", color: "white", borderRadius: "50%",
    width: "18px", height: "18px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.65rem",
  },
  successMsg: {
    background: "rgba(0, 230, 118, 0.1)", border: "1px solid rgba(0,230,118,0.3)",
    color: "var(--success)", padding: "1rem", borderRadius: "12px",
    marginBottom: "1rem", fontWeight: "600",
  },
  errorMsg: {
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    color: "#FF3D57", padding: "1rem", borderRadius: "12px",
    marginBottom: "1rem", fontWeight: "600",
  },
  saveBtn: {
    width: "100%", padding: "1.1rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontSize: "1rem", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px",
  },
};
