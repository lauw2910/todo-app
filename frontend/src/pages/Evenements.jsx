import { useState, useEffect } from "react";
import VilleInput from "../components/VilleInput";

export default function Evenements({ token }) {
  const [evenements, setEvenements] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [evenementActif, setEvenementActif] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [onglet, setOnglet] = useState("tous");
  const [toast, setToast] = useState("");
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({
    titre: "", sport_id: "", ville: "",
    date_evenement: "", nb_places: 10, description: ""
  });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchEvenements();
    fetchSports();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    setUserId(user?.id);
  }, []);

  useEffect(() => {
    if (!evenementActif) return;
    fetchParticipants(evenementActif.id);
  }, [evenementActif]);

  async function fetchEvenements() {
    const res = await fetch("/api/evenements", { headers });
    const data = await res.json();
    setEvenements(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchSports() {
    const res = await fetch("/api/profil/sports", { headers });
    const data = await res.json();
    setSports(data);
  }

  async function fetchParticipants(id) {
    const res = await fetch(`/api/evenements/${id}/participants`, { headers });
    const data = await res.json();
    setParticipants(Array.isArray(data) ? data : []);
  }

  async function creerEvenement() {
    if (!form.titre || !form.sport_id || !form.date_evenement) {
      showToast("❌ Titre, sport et date requis");
      return;
    }
    const res = await fetch("/api/evenements", { method: "POST", headers, body: JSON.stringify(form) });
    if (res.ok) {
      showToast("✅ Événement créé !");
      setShowCreate(false);
      setForm({ titre: "", sport_id: "", ville: "", date_evenement: "", nb_places: 10, description: "" });
      fetchEvenements();
    }
  }

  async function rejoindre(id) {
    const res = await fetch(`/api/evenements/${id}/rejoindre`, { method: "POST", headers });
    const data = await res.json();
    showToast(data.statut === "en_attente" ? "⏳ Demande envoyée !" : "✅ Inscrit !");
    fetchEvenements();
    if (evenementActif?.id === id) fetchParticipants(id);
  }

  async function quitter(id) {
    await fetch(`/api/evenements/${id}/quitter`, { method: "DELETE", headers });
    showToast("Désinscrit");
    fetchEvenements();
    if (evenementActif?.id === id) fetchParticipants(id);
  }

  async function changerStatut(evenementId, participantId, statut) {
    await fetch(`/api/evenements/${evenementId}/participants/${participantId}`, {
      method: "PUT", headers, body: JSON.stringify({ statut }),
    });
    showToast(statut === "accepte" ? "✅ Participant accepté !" : "❌ Participant refusé");
    fetchParticipants(evenementId);
    fetchEvenements();
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
      year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  const niveauColors = {
    debutant: "#00E676", intermediaire: "#0057FF", avance: "#FFB300", expert: "#FF3D57"
  };

  const evenementsFiltres = evenements.filter(e => {
    if (onglet === "mes") return e.est_inscrit;
    if (onglet === "organises") return e.organisateur_id === userId;
    return true;
  });

  // Vue participants
  if (evenementActif) {
    const isOrganisateur = evenementActif.organisateur_id === userId;
    const enAttente = participants.filter(p => p.statut === "en_attente");
    const acceptes = participants.filter(p => p.statut === "accepte");
    const refuses = participants.filter(p => p.statut === "refuse");

    return (
      <div style={s.container} className="fade-in">
        {toast && <div style={s.toast}>{toast}</div>}
        <button style={s.backBtn} onClick={() => setEvenementActif(null)}>← Retour</button>

        <div style={s.eventHeader}>
          <div style={s.eventIconBig}>{evenementActif.sport_icone}</div>
          <div>
            <h2 style={s.eventTitreBig}>{evenementActif.titre}</h2>
            <div style={s.eventMetaBig}>
              <span>📅 {formatDate(evenementActif.date_evenement)}</span>
              <span>📍 {evenementActif.ville}</span>
              <span>👤 Organisé par {evenementActif.organisateur}</span>
            </div>
            {evenementActif.description && <p style={s.eventDesc}>{evenementActif.description}</p>}
          </div>
        </div>

        {isOrganisateur && enAttente.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>⏳ Demandes en attente ({enAttente.length})</h3>
            <div style={s.participantsList}>
              {enAttente.map(p => (
                <div key={p.id} style={s.participantCard}>
                  <div style={s.participantAvatar}>
                    {p.photo
                      ? <img src={p.photo} style={s.participantAvatarImg} alt="" />
                      : `${p.prenom?.[0]}${p.nom?.[0]}`
                    }
                  </div>
                  <div style={s.participantInfo}>
                    <div style={s.participantNom}>{p.prenom} {p.nom}</div>
                    <div style={s.participantMeta}>
                      <span style={{color: niveauColors[p.niveau]}}>{p.niveau}</span>
                      {p.ville && <span>📍 {p.ville}</span>}
                    </div>
                  </div>
                  <div style={s.participantActions}>
                    <button style={s.acceptBtn} onClick={() => changerStatut(evenementActif.id, p.id, "accepte")}>
                      ✓ Accepter
                    </button>
                    <button style={s.refuseBtn} onClick={() => changerStatut(evenementActif.id, p.id, "refuse")}>
                      ✗ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={s.section}>
          <h3 style={s.sectionTitle}>✅ Participants acceptés ({acceptes.length} / {evenementActif.nb_places})</h3>
          {acceptes.length === 0 ? (
            <p style={s.emptyText}>Aucun participant pour l'instant</p>
          ) : (
            <div style={s.participantsList}>
              {acceptes.map(p => (
                <div key={p.id} style={s.participantCard}>
                  <div style={s.participantAvatar}>
                    {p.photo
                      ? <img src={p.photo} style={s.participantAvatarImg} alt="" />
                      : `${p.prenom?.[0]}${p.nom?.[0]}`
                    }
                  </div>
                  <div style={s.participantInfo}>
                    <div style={s.participantNom}>{p.prenom} {p.nom}</div>
                    <div style={s.participantMeta}>
                      <span style={{color: niveauColors[p.niveau]}}>{p.niveau}</span>
                      {p.ville && <span>📍 {p.ville}</span>}
                    </div>
                  </div>
                  {isOrganisateur && p.id !== userId && (
                    <button style={s.refuseBtn} onClick={() => changerStatut(evenementActif.id, p.id, "refuse")}>
                      ✗ Retirer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOrganisateur && refuses.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>❌ Participants refusés ({refuses.length})</h3>
            <div style={s.participantsList}>
              {refuses.map(p => (
                <div key={p.id} style={s.participantCard}>
                  <div style={{...s.participantAvatar, opacity: 0.5}}>
                    {p.photo
                      ? <img src={p.photo} style={s.participantAvatarImg} alt="" />
                      : `${p.prenom?.[0]}${p.nom?.[0]}`
                    }
                  </div>
                  <div style={s.participantInfo}>
                    <div style={{...s.participantNom, opacity: 0.5}}>{p.prenom} {p.nom}</div>
                  </div>
                  <button style={s.acceptBtn} onClick={() => changerStatut(evenementActif.id, p.id, "accepte")}>
                    ✓ Réaccepter
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={s.container} className="fade-in">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Événements sportifs</h1>
          <p style={s.pageDesc}>Rejoins ou organise des événements près de chez toi</p>
        </div>
        <button style={s.createBtn} onClick={() => setShowCreate(true)}>
          + Créer un événement
        </button>
      </div>

      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()} className="fade-in">
            <h3 style={s.modalTitle}>📅 Créer un événement</h3>
            <div style={s.field}>
              <label style={s.label}>Titre *</label>
              <input style={s.input} placeholder="Ex: Match de foot dimanche"
                value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Ville</label>
              <VilleInput
                style={s.input}
                value={form.ville}
                onChange={val => setForm({...form, ville: val})}
              />
            </div>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Sport *</label>
                <select style={s.input} value={form.sport_id}
                  onChange={e => setForm({...form, sport_id: e.target.value})}>
                  <option value="">Choisir</option>
                  {sports.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.icone} {sp.nom}</option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Places</label>
                <input style={s.input} type="number" min="2" max="100"
                  value={form.nb_places} onChange={e => setForm({...form, nb_places: e.target.value})} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Date et heure *</label>
              <input style={s.input} type="datetime-local"
                value={form.date_evenement} onChange={e => setForm({...form, date_evenement: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{...s.input, height: "80px", resize: "vertical"}}
                placeholder="Décris ton événement..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setShowCreate(false)}>Annuler</button>
              <button style={s.submitBtn} onClick={creerEvenement}>✓ Créer</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.tabs}>
        {[
          { id: "tous", label: "🌍 Tous", count: evenements.length },
          { id: "mes", label: "✓ Mes inscriptions", count: evenements.filter(e => e.est_inscrit).length },
          { id: "organises", label: "👑 Mes événements", count: evenements.filter(e => e.organisateur_id === userId).length },
        ].map(t => (
          <button key={t.id}
            style={{...s.tab, ...(onglet === t.id ? s.tabActive : {})}}
            onClick={() => setOnglet(t.id)}>
            {t.label} <span style={s.tabBadge}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.loading}><div style={s.spinner}/></div>
      ) : evenementsFiltres.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>📅</span>
          <h3 style={s.emptyTitle}>Aucun événement</h3>
          <p style={s.emptySub}>Crée le premier événement !</p>
        </div>
      ) : (
        <div style={s.grid}>
          {evenementsFiltres.map(e => {
            const isOrganisateur = e.organisateur_id === userId;
            const enAttente = e.mon_statut === "en_attente";
            const refuse = e.mon_statut === "refuse";
            const complet = parseInt(e.nb_participants) >= parseInt(e.nb_places);

            return (
              <div key={e.id} style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.cardSportIcon}>{e.sport_icone}</span>
                  <div style={s.cardBadges}>
                    {isOrganisateur && <span style={s.orgBadge}>👑 Organisateur</span>}
                    {e.est_inscrit && !isOrganisateur && (
                      <span style={{...s.statutBadge,
                        background: enAttente ? "rgba(255,179,0,0.1)" : refuse ? "rgba(255,61,87,0.1)" : "rgba(0,230,118,0.1)",
                        color: enAttente ? "#FFB300" : refuse ? "#FF3D57" : "#00E676",
                        border: `1px solid ${enAttente ? "rgba(255,179,0,0.3)" : refuse ? "rgba(255,61,87,0.3)" : "rgba(0,230,118,0.3)"}`,
                      }}>
                        {enAttente ? "⏳ En attente" : refuse ? "❌ Refusé" : "✅ Inscrit"}
                      </span>
                    )}
                  </div>
                </div>
                <h3 style={s.cardTitre}>{e.titre}</h3>
                <div style={s.cardInfos}>
                  <span style={s.cardInfo}>🏅 {e.sport_nom}</span>
                  <span style={s.cardInfo}>📅 {new Date(e.date_evenement).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {e.ville && <span style={s.cardInfo}>📍 {e.ville}</span>}
                  <span style={{...s.cardInfo, color: complet ? "#FF3D57" : "#00E676"}}>
                    👥 {e.nb_participants}/{e.nb_places} {complet ? "• Complet" : ""}
                  </span>
                </div>
                {e.description && <p style={s.cardDesc}>{e.description}</p>}
                <p style={s.cardOrganisateur}>Par {e.organisateur}</p>
                <div style={s.cardBtns}>
                  <button style={s.voirBtn} onClick={() => setEvenementActif(e)}>
                    👥 Participants
                  </button>
                  {!isOrganisateur && (
                    e.est_inscrit ? (
                      <button style={s.quitterBtn} onClick={() => quitter(e.id)}>
                        Quitter
                      </button>
                    ) : (
                      <button style={{...s.rejoindreBtn, opacity: complet ? 0.5 : 1}}
                        onClick={() => !complet && rejoindre(e.id)}
                        disabled={complet}>
                        {complet ? "Complet" : "+ Rejoindre"}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  toast: {
    position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
    background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem 1.5rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  createBtn: {
    padding: "0.85rem 1.5rem",
    background: "linear-gradient(135deg, var(--blue), #0080ff)",
    color: "white", border: "none", borderRadius: "12px",
    fontWeight: "700", cursor: "pointer", fontSize: "0.95rem",
  },
  tabs: {
    display: "flex", gap: "0.5rem", marginBottom: "2rem",
    background: "var(--dark3)", borderRadius: "12px", padding: "4px",
    width: "fit-content", flexWrap: "wrap",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.6rem 1.25rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.9rem",
  },
  tabActive: { background: "var(--blue)", color: "white" },
  tabBadge: {
    background: "rgba(255,255,255,0.2)", color: "white",
    borderRadius: "20px", padding: "0.1rem 0.5rem", fontSize: "0.75rem",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--dark3)", borderRadius: "20px", padding: "2rem",
    width: "460px", border: "1px solid rgba(0,87,255,0.3)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto",
  },
  modalTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "white", marginBottom: "1.5rem",
  },
  field: { marginBottom: "1rem" },
  label: {
    display: "block", color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
  },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--dark4)", border: "2px solid transparent",
    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  modalBtns: { display: "flex", gap: "0.75rem", marginTop: "0.5rem" },
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
  loading: { display: "flex", justifyContent: "center", padding: "4rem" },
  spinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
  },
  empty: { textAlign: "center", padding: "5rem 0" },
  emptyIcon: { fontSize: "4rem", display: "block", marginBottom: "1rem" },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  emptySub: { color: "var(--text2)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  card: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" },
  cardSportIcon: { fontSize: "2rem" },
  cardBadges: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  orgBadge: {
    background: "rgba(255,179,0,0.1)", color: "#FFB300",
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  statutBadge: {
    padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
  },
  cardTitre: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: "800", color: "white", marginBottom: "0.5rem",
  },
  cardInfos: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" },
  cardInfo: { color: "var(--text2)", fontSize: "0.8rem" },
  cardDesc: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "0.5rem" },
  cardOrganisateur: { color: "var(--text2)", fontSize: "0.78rem", marginBottom: "1rem" },
  cardBtns: { display: "flex", gap: "0.5rem" },
  voirBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "10px", color: "var(--cyan)", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  rejoindreBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    borderRadius: "10px", color: "#00E676", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  quitterBtn: {
    flex: 1, padding: "0.7rem",
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    borderRadius: "10px", color: "#FF3D57", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  backBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text2)", padding: "0.5rem 1rem", borderRadius: "8px",
    cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", marginBottom: "1.5rem",
    display: "inline-block",
  },
  eventHeader: {
    display: "flex", gap: "1.5rem", alignItems: "flex-start",
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.5rem",
  },
  eventIconBig: { fontSize: "3rem", flexShrink: 0 },
  eventTitreBig: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: "900", color: "white", marginBottom: "0.5rem",
  },
  eventMetaBig: { display: "flex", flexWrap: "wrap", gap: "1rem", color: "var(--text2)", fontSize: "0.85rem" },
  eventDesc: { color: "var(--text2)", fontSize: "0.9rem", marginTop: "0.5rem", lineHeight: "1.6" },
  section: {
    background: "var(--dark3)", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.1rem",
    fontWeight: "800", color: "white", marginBottom: "1rem",
  },
  emptyText: { color: "var(--text2)", fontSize: "0.9rem" },
  participantsList: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  participantCard: {
    display: "flex", alignItems: "center", gap: "1rem",
    background: "var(--dark4)", borderRadius: "12px", padding: "0.75rem 1rem",
  },
  participantAvatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: "900", color: "white",
    fontSize: "0.9rem", flexShrink: 0, overflow: "hidden",
  },
  participantAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  participantInfo: { flex: 1 },
  participantNom: { color: "white", fontWeight: "700", fontSize: "0.95rem" },
  participantMeta: { display: "flex", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text2)", marginTop: "0.2rem" },
  participantActions: { display: "flex", gap: "0.5rem" },
  acceptBtn: {
    padding: "0.5rem 1rem",
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    borderRadius: "8px", color: "#00E676", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
  refuseBtn: {
    padding: "0.5rem 1rem",
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    borderRadius: "8px", color: "#FF3D57", fontSize: "0.85rem",
    fontWeight: "700", cursor: "pointer",
  },
};
