import { useState } from "react";

export default function Confidentialite({ token, onClose, initialTab = "cgu" }) {
  const [tab, setTab] = useState(initialTab);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function exportDonnees() {
    const res = await fetch("/api/rgpd/export", { headers });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mes-donnees-sportconnect.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function supprimerCompte() {
    setLoading(true);
    setDeleteMsg("");
    const res = await fetch("/api/rgpd/supprimer-compte", {
      method: "DELETE", headers,
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setDeleteMsg("✅ Compte supprimé. Vous allez être déconnecté...");
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
      }, 2000);
    } else {
      setDeleteMsg("❌ " + data.error);
    }
    setLoading(false);
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>⚖️ Légal & RGPD</h2>
          {onClose && <button style={s.closeBtn} onClick={onClose}>✕</button>}
        </div>

        <div style={s.tabs}>
          {[
            { id: "cgu", label: "📋 CGU" },
            { id: "confidentialite", label: "🔒 Confidentialité" },
            { id: "donnees", label: "📦 Mes données" },
          ].map(t => (
            <button key={t.id}
              style={{...s.tab, ...(tab === t.id ? s.tabActive : {})}}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={s.content}>

          {/* CGU */}
          {tab === "cgu" && (
            <div style={s.legal}>
              <h3 style={s.legalTitle}>Conditions Générales d'Utilisation</h3>
              <p style={s.legalDate}>Version 1.0 — En vigueur depuis le 1er janvier 2026</p>

              <h4 style={s.legalH4}>1. Objet</h4>
              <p style={s.legalP}>
                SportConnect est une plateforme de mise en relation entre sportifs amateurs.
                Les présentes CGU régissent l'utilisation du service accessible sur sportconnect.duckdns.org.
              </p>

              <h4 style={s.legalH4}>2. Inscription</h4>
              <p style={s.legalP}>
                L'inscription est gratuite et ouverte à toute personne physique majeure.
                L'utilisateur s'engage à fournir des informations exactes et à maintenir
                la confidentialité de ses identifiants de connexion.
              </p>

              <h4 style={s.legalH4}>3. Utilisation du service</h4>
              <p style={s.legalP}>
                L'utilisateur s'engage à utiliser SportConnect de manière loyale et conforme
                aux lois en vigueur. Il est interdit de publier des contenus illicites,
                diffamatoires, ou portant atteinte aux droits des tiers.
              </p>

              <h4 style={s.legalH4}>4. Responsabilité</h4>
              <p style={s.legalP}>
                SportConnect est une plateforme de mise en relation. Nous ne sommes pas
                responsables des rencontres organisées entre utilisateurs ni des dommages
                qui pourraient en résulter. Les utilisateurs sont seuls responsables
                de leurs interactions.
              </p>

              <h4 style={s.legalH4}>5. Modération</h4>
              <p style={s.legalP}>
                SportConnect se réserve le droit de supprimer tout contenu inapproprié
                et de suspendre ou supprimer tout compte ne respectant pas ces CGU,
                sans préavis ni indemnité.
              </p>

              <h4 style={s.legalH4}>6. Propriété intellectuelle</h4>
              <p style={s.legalP}>
                Le nom SportConnect, son logo et ses contenus originaux sont protégés
                par le droit de la propriété intellectuelle. Toute reproduction est
                interdite sans autorisation préalable.
              </p>

              <h4 style={s.legalH4}>7. Modification des CGU</h4>
              <p style={s.legalP}>
                Nous nous réservons le droit de modifier ces CGU à tout moment.
                Les utilisateurs seront informés par email des modifications importantes.
              </p>

              <h4 style={s.legalH4}>8. Droit applicable</h4>
              <p style={s.legalP}>
                Les présentes CGU sont soumises au droit français.
                Tout litige sera soumis aux tribunaux compétents français.
              </p>
            </div>
          )}

          {/* Politique de confidentialité */}
          {tab === "confidentialite" && (
            <div style={s.legal}>
              <h3 style={s.legalTitle}>Politique de Confidentialité</h3>
              <p style={s.legalDate}>Conforme au RGPD (Règlement UE 2016/679)</p>

              <h4 style={s.legalH4}>1. Responsable du traitement</h4>
              <p style={s.legalP}>
                SportConnect — contact : legue.laurent@gmail.com
              </p>

              <h4 style={s.legalH4}>2. Données collectées</h4>
              <p style={s.legalP}>Nous collectons les données suivantes :</p>
              <ul style={s.legalUl}>
                <li style={s.legalLi}>Identité : prénom, nom, âge</li>
                <li style={s.legalLi}>Contact : adresse email</li>
                <li style={s.legalLi}>Localisation : ville</li>
                <li style={s.legalLi}>Pratiques sportives : sports, niveau</li>
                <li style={s.legalLi}>Photo de profil (optionnelle)</li>
                <li style={s.legalLi}>Messages échangés avec d'autres utilisateurs</li>
                <li style={s.legalLi}>Participation aux événements et groupes</li>
              </ul>

              <h4 style={s.legalH4}>3. Finalités du traitement</h4>
              <ul style={s.legalUl}>
                <li style={s.legalLi}>Fourniture du service de mise en relation sportive</li>
                <li style={s.legalLi}>Authentification et sécurité du compte</li>
                <li style={s.legalLi}>Envoi de notifications par email (si activées)</li>
                <li style={s.legalLi}>Amélioration du service</li>
              </ul>

              <h4 style={s.legalH4}>4. Base légale</h4>
              <p style={s.legalP}>
                Le traitement est fondé sur l'exécution du contrat (CGU) et
                le consentement de l'utilisateur pour les communications optionnelles.
              </p>

              <h4 style={s.legalH4}>5. Durée de conservation</h4>
              <p style={s.legalP}>
                Vos données sont conservées pendant toute la durée d'activité de votre compte,
                puis supprimées dans un délai de 30 jours après la clôture du compte.
              </p>

              <h4 style={s.legalH4}>6. Vos droits</h4>
              <ul style={s.legalUl}>
                <li style={s.legalLi}>✅ Droit d'accès à vos données</li>
                <li style={s.legalLi}>✅ Droit de rectification</li>
                <li style={s.legalLi}>✅ Droit à l'effacement (droit à l'oubli)</li>
                <li style={s.legalLi}>✅ Droit à la portabilité des données</li>
                <li style={s.legalLi}>✅ Droit d'opposition</li>
              </ul>
              <p style={s.legalP}>
                Pour exercer ces droits, rendez-vous dans l'onglet "Mes données" ou
                contactez-nous à legue.laurent@gmail.com.
                Vous pouvez également saisir la CNIL : cnil.fr
              </p>

              <h4 style={s.legalH4}>7. Cookies</h4>
              <p style={s.legalP}>
                Nous utilisons des cookies essentiels au fonctionnement du service
                (authentification). Les cookies optionnels (analytics, marketing)
                nécessitent votre consentement explicite.
              </p>

              <h4 style={s.legalH4}>8. Sécurité</h4>
              <p style={s.legalP}>
                Vos données sont protégées par chiffrement HTTPS, hachage des mots de passe
                (bcrypt), et des mesures techniques de sécurité (rate limiting, headers sécurisés).
              </p>
            </div>
          )}

          {/* Mes données */}
          {tab === "donnees" && (
            <div>
              <div style={s.dataSection}>
                <div style={s.dataIcon}>📦</div>
                <div>
                  <h4 style={s.dataTitle}>Exporter mes données</h4>
                  <p style={s.dataDesc}>
                    Téléchargez toutes vos données personnelles au format JSON
                    (profil, messages, événements, évaluations...).
                    Conformément au RGPD, vous avez le droit à la portabilité de vos données.
                  </p>
                  <button style={s.exportBtn} onClick={exportDonnees}>
                    📥 Télécharger mes données
                  </button>
                </div>
              </div>

              <div style={s.divider}/>

              <div style={s.dataSection}>
                <div style={s.dataIcon}>🗑️</div>
                <div style={{flex: 1}}>
                  <h4 style={{...s.dataTitle, color: "#FF3D57"}}>Supprimer mon compte</h4>
                  <p style={s.dataDesc}>
                    La suppression est définitive et irréversible. Toutes vos données
                    (profil, messages, événements, groupes) seront supprimées immédiatement.
                    Conformément au RGPD, vous exercez votre droit à l'effacement.
                  </p>
                  {!showDelete ? (
                    <button style={s.deleteBtn} onClick={() => setShowDelete(true)}>
                      ⚠️ Supprimer mon compte
                    </button>
                  ) : (
                    <div style={s.deleteForm}>
                      <p style={s.deleteWarning}>
                        ⚠️ Cette action est irréversible. Confirmez avec votre mot de passe :
                      </p>
                      <input style={s.input} type="password"
                        placeholder="Votre mot de passe"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)} />
                      {deleteMsg && (
                        <div style={deleteMsg.includes("✅") ? s.successMsg : s.errorMsg}>
                          {deleteMsg}
                        </div>
                      )}
                      <div style={s.deleteBtns}>
                        <button style={s.cancelBtn} onClick={() => setShowDelete(false)}>
                          Annuler
                        </button>
                        <button style={s.confirmDeleteBtn}
                          onClick={supprimerCompte} disabled={loading}>
                          {loading ? "Suppression..." : "✓ Confirmer la suppression"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000, backdropFilter: "blur(4px)", padding: "1rem",
  },
  modal: {
    background: "var(--dark3)", borderRadius: "20px",
    width: "100%", maxWidth: "680px", maxHeight: "85vh",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex", flexDirection: "column",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1.5rem 1.5rem 0",
  },
  modalTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem",
    fontWeight: "900", color: "white",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text2)", width: "32px", height: "32px", borderRadius: "50%",
    cursor: "pointer", fontSize: "0.85rem",
  },
  tabs: {
    display: "flex", gap: "0.25rem", padding: "1rem 1.5rem 0",
  },
  tab: {
    padding: "0.6rem 1rem", border: "none", background: "transparent",
    color: "var(--text2)", cursor: "pointer", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.85rem",
  },
  tabActive: { background: "rgba(0,87,255,0.2)", color: "var(--cyan)" },
  content: {
    flex: 1, overflowY: "auto", padding: "1.5rem",
  },
  legal: {},
  legalTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.3rem",
    fontWeight: "800", color: "white", marginBottom: "0.25rem",
  },
  legalDate: { color: "var(--text2)", fontSize: "0.8rem", marginBottom: "1.5rem" },
  legalH4: { color: "var(--cyan)", fontWeight: "700", fontSize: "0.95rem", margin: "1.25rem 0 0.5rem" },
  legalP: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.7" },
  legalUl: { paddingLeft: "1.25rem", margin: "0.5rem 0" },
  legalLi: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.8" },
  dataSection: {
    display: "flex", gap: "1rem", padding: "1.5rem 0",
  },
  dataIcon: { fontSize: "2.5rem", flexShrink: 0 },
  dataTitle: { color: "white", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" },
  dataDesc: { color: "var(--text2)", fontSize: "0.85rem", lineHeight: "1.6", marginBottom: "1rem" },
  exportBtn: {
    padding: "0.75rem 1.5rem",
    background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "10px", color: "var(--cyan)", fontWeight: "700",
    cursor: "pointer", fontSize: "0.9rem",
  },
  divider: {
    height: "1px", background: "rgba(255,255,255,0.05)", margin: "0.5rem 0",
  },
  deleteBtn: {
    padding: "0.75rem 1.5rem",
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    borderRadius: "10px", color: "#FF3D57", fontWeight: "700",
    cursor: "pointer", fontSize: "0.9rem",
  },
  deleteForm: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  deleteWarning: {
    color: "#FFB300", fontSize: "0.85rem", fontWeight: "600",
    background: "rgba(255,179,0,0.1)", padding: "0.75rem", borderRadius: "8px",
  },
  input: {
    padding: "0.85rem 1rem", background: "var(--dark4)",
    border: "2px solid rgba(255,61,87,0.3)", borderRadius: "10px",
    color: "white", fontSize: "0.9rem", outline: "none",
  },
  successMsg: {
    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
    color: "#00E676", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem",
  },
  errorMsg: {
    background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
    color: "#FF3D57", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem",
  },
  deleteBtns: { display: "flex", gap: "0.75rem" },
  cancelBtn: {
    flex: 1, padding: "0.75rem", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "var(--text2)", cursor: "pointer", fontWeight: "600",
  },
  confirmDeleteBtn: {
    flex: 1, padding: "0.75rem",
    background: "rgba(255,61,87,0.2)", border: "1px solid rgba(255,61,87,0.4)",
    borderRadius: "10px", color: "#FF3D57", fontWeight: "700", cursor: "pointer",
  },
};
