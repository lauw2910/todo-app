import { useState, useEffect } from "react";

function Etoiles({ note, onNote, readonly }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}
          style={{
            fontSize: readonly ? "0.9rem" : "1.2rem",
            cursor: readonly ? "default" : "pointer",
            color: i <= (hover || note) ? "#FFB300" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s",
          }}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onNote && onNote(i)}
        >★</span>
      ))}
    </div>
  );
}

function ModalEvaluation({ joueur, token, onClose, onSaved }) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (note === 0) { setError("Choisis une note"); return; }
    setLoading(true);
    const res = await fetch(`/api/evaluations/${joueur.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note, commentaire }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    onSaved();
    onClose();
  }

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()} className="fade-in">
        <h3 style={m.title}>⭐ Évaluer {joueur.prenom} {joueur.nom}</h3>
        <p style={m.sub}>Ton évaluation aidera les autres sportifs</p>

        <div style={m.noteSection}>
          <label style={m.label}>Ta note</label>
          <Etoiles note={note} onNote={setNote} />
          <span style={m.noteText}>
            {note === 0 ? "Clique pour noter" : ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent !"][note]}
          </span>
        </div>

        <div style={m.fieldGroup}>
          <label style={m.label}>Commentaire (optionnel)</label>
          <textarea style={m.textarea}
            placeholder="Décris ton expérience avec ce joueur..."
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            rows={3}
          />
        </div>

        {error && <p style={m.error}>{error}</p>}

        <div style={m.actions}>
          <button style={m.cancelBtn} onClick={onClose}>Annuler</button>
          <button style={m.submitBtn} onClick={submit} disabled={loading}>
            {loading ? "Envoi..." : "✓ Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Joueurs({ token, onContact }) {
  const [joueurs, setJoueurs] = useState([]);
  const [sports, setSports] = useState([]);
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreSport, setFiltreSport] = useState("");
  const [loading, setLoading] = useState(false);
  const [evalModal, setEvalModal] = useState(null);
  const [moyennes, setMoyennes] = useState({});

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchSports() {
    const res = await fetch("/api/profil/sports", { headers });
    const data = await res.json();
    setSports(data);
  }

  async function fetchJoueurs(ville, sport) {
    setLoading(true);
    let url = "/api/joueurs?";
    if (ville) url += `ville=${ville}&`;
    if (sport) url += `sport=${sport}&`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    const liste = Array.isArray(data) ? data : [];
    setJoueurs(liste);
    setLoading(false);
    fetchMoyennes(liste);
  }

  async function fetchMoyennes(liste) {
    const result = {};
    await Promise.all(liste.map(async j => {
      const res = await fetch(`/api/evaluations/${j.id}`, { headers });
      const data = await res.json();
      result[j.id] = { moyenne: data.moyenne || 0, total: data.total || 0 };
    }));
    setMoyennes(result);
  }

  useEffect(() => {
    fetchSports();
    fetchJoueurs("", "");
  }, []);

  const niveauColors = {
    debutant: { bg: "rgba(0,230,118,0.1)", color: "#00E676", label: "Débutant" },
    intermediaire: { bg: "rgba(0,87,255,0.1)", color: "#0057FF", label: "Intermédiaire" },
    avance: { bg: "rgba(255,179,0,0.1)", color: "#FFB300", label: "Avancé" },
    expert: { bg: "rgba(255,61,87,0.1)", color: "#FF3D57", label: "Expert" },
  };

  return (
    <div style={s.container} className="fade-in">
      {evalModal && (
        <ModalEvaluation
          joueur={evalModal}
          token={token}
          onClose={() => setEvalModal(null)}
          onSaved={() => fetchMoyennes(joueurs)}
        />
      )}

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Trouver des joueurs</h1>
          <p style={s.pageDesc}>Recherche des partenaires sportifs près de chez toi</p>
        </div>
        <div style={s.resultCount}>
          <span style={s.resultNum}>{joueurs.length}</span>
          <span style={s.resultLabel}>joueur{joueurs.length > 1 ? "s" : ""} trouvé{joueurs.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={s.filters}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>🏙️ Ville</label>
          <input style={s.filterInput} placeholder="Ex: Paris, Lyon..."
            value={filtreVille} onChange={e => setFiltreVille(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchJoueurs(filtreVille, filtreSport)} />
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>🏅 Sport</label>
          <select style={s.filterInput} value={filtreSport}
            onChange={e => setFiltreSport(e.target.value)}>
            <option value="">Tous les sports</option>
            {sports.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.icone} {sp.nom}</option>
            ))}
          </select>
        </div>
        <button style={s.searchBtn} onClick={() => fetchJoueurs(filtreVille, filtreSport)}>
          🔍 Rechercher
        </button>
        {(filtreVille || filtreSport) && (
          <button style={s.resetBtn} onClick={() => { setFiltreVille(""); setFiltreSport(""); fetchJoueurs("", ""); }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {loading && (
        <div style={s.loadingState}>
          <div style={s.loadingSpinner}/>
          <p style={{ color: "var(--text2)" }}>Recherche en cours...</p>
        </div>
      )}

      {!loading && joueurs.length === 0 && (
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>😔</span>
          <h3 style={s.emptyTitle}>Aucun joueur trouvé</h3>
          <p style={s.emptyDesc}>Essaie avec d'autres critères de recherche</p>
        </div>
      )}

      {!loading && joueurs.length > 0 && (
        <div style={s.grid}>
          {joueurs.map(joueur => {
            const niveau = niveauColors[joueur.niveau] || niveauColors.debutant;
            const eval_ = moyennes[joueur.id] || { moyenne: 0, total: 0 };
            return (
              <div key={joueur.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>
                    {joueur.prenom?.[0]?.toUpperCase() || "?"}
                    {joueur.nom?.[0]?.toUpperCase() || ""}
                  </div>
                  <div style={{...s.niveauBadge, background: niveau.bg, color: niveau.color}}>
                    {niveau.label}
                  </div>
                </div>

                <h3 style={s.nom}>{joueur.prenom} {joueur.nom}</h3>

                <div style={s.evalRow}>
                  <Etoiles note={Math.round(eval_.moyenne)} readonly />
                  <span style={s.evalMoyenne}>
                    {eval_.moyenne > 0 ? `${eval_.moyenne}/5` : "Pas encore noté"}
                  </span>
                  <span style={s.evalTotal}>
                    {eval_.total > 0 ? `(${eval_.total} avis)` : ""}
                  </span>
                </div>

                <div style={s.infos}>
                  {joueur.ville && <span style={s.info}>📍 {joueur.ville}</span>}
                  {joueur.age && <span style={s.info}>🎂 {joueur.age} ans</span>}
                </div>

                <div style={s.sports}>
                  {joueur.icones?.slice(0, 4).map((icone, i) => (
                    <span key={i} style={s.sportTag}>{icone} {joueur.sports[i]}</span>
                  ))}
                  {joueur.icones?.length > 4 && (
                    <span style={s.sportMore}>+{joueur.icones.length - 4}</span>
                  )}
                </div>

                <div style={s.btnRow}>
                  <button style={s.contactBtn} onClick={() => onContact && onContact(joueur)}>
                    💬 Contacter
                  </button>
                  <button style={s.evalBtn} onClick={() => setEvalModal(joueur)}>
                    ⭐ Noter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const m = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--dark3)", borderRadius: "20px", padding: "2rem",
    width: "420px", border: "1px solid rgba(0,87,255,0.3)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  title: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  sub: { color: "var(--text2)", fontSize: "0.85rem", marginBottom: "1.5rem" },
  noteSection: { marginBottom: "1.25rem" },
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px",
    marginBottom: "0.5rem",
  },
  noteText: { color: "var(--text2)", fontSize: "0.85rem", marginTop: "0.4rem", display: "block" },
  fieldGroup: { marginBottom: "1.25rem" },
  textarea: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem",
    outline: "none", resize: "vertical", boxSizing: "border-box",
  },
  error: { color: "#FF3D57", fontSize: "0.85rem", marginBottom: "1rem" },
  actions: { display: "flex", gap: "0.75rem" },
  cancelBtn: {
    flex: 1, padding: "0.85rem", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontWeight: "600",
  },
  submitBtn: {
    flex: 1, padding: "0.85rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "10px",
    fontWeight: "700", cursor: "pointer",
  },
};

const s = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "2rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  resultCount: { textAlign: "right" },
  resultNum: {
    display: "block", fontFamily: "var(--font-display)",
    fontSize: "2.5rem", fontWeight: "900", color: "var(--cyan)",
  },
  resultLabel: { color: "var(--text2)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" },
  filters: {
    display: "flex", gap: "1rem", alignItems: "flex-end",
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "2rem",
    flexWrap: "wrap",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1, minWidth: "160px" },
  filterLabel: {
    color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px",
  },
  filterInput: {
    padding: "0.75rem 1rem", background: "var(--dark4)",
    border: "2px solid transparent", borderRadius: "10px",
    color: "white", fontSize: "0.9rem", outline: "none",
  },
  searchBtn: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "10px",
    fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", alignSelf: "flex-end",
  },
  resetBtn: {
    padding: "0.75rem 1rem", background: "rgba(255,61,87,0.1)",
    border: "1px solid rgba(255,61,87,0.3)", borderRadius: "10px",
    color: "#FF3D57", fontSize: "0.9rem", fontWeight: "600",
    cursor: "pointer", alignSelf: "flex-end",
  },
  loadingState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "1rem", padding: "4rem 0",
  },
  loadingSpinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
  },
  emptyState: { textAlign: "center", padding: "5rem 0" },
  emptyIcon: { fontSize: "4rem", display: "block", marginBottom: "1rem" },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  emptyDesc: { color: "var(--text2)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
    transition: "transform 0.2s, border-color 0.2s",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "1rem",
  },
  avatar: {
    width: "56px", height: "56px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: "900", color: "white",
  },
  niveauBadge: {
    padding: "0.3rem 0.75rem", borderRadius: "20px",
    fontSize: "0.75rem", fontWeight: "700",
  },
  nom: {
    fontFamily: "var(--font-display)", fontSize: "1.3rem",
    fontWeight: "800", color: "white", marginBottom: "0.4rem",
  },
  evalRow: {
    display: "flex", alignItems: "center", gap: "0.4rem",
    marginBottom: "0.75rem",
  },
  evalMoyenne: { color: "#FFB300", fontSize: "0.85rem", fontWeight: "700" },
  evalTotal: { color: "var(--text2)", fontSize: "0.8rem" },
  infos: { display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" },
  info: { color: "var(--text2)", fontSize: "0.85rem" },
  sports: { display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" },
  sportTag: {
    background: "var(--dark4)", color: "var(--text2)",
    padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem",
  },
  sportMore: {
    background: "rgba(0,87,255,0.15)", color: "var(--cyan)",
    padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700",
  },
  btnRow: { display: "flex", gap: "0.5rem" },
  contactBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "10px", color: "var(--cyan)", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  evalBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.3)",
    borderRadius: "10px", color: "#FFB300", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
};
