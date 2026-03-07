const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

router.use(auth);

// GET /api/rgpd/export — export toutes les données personnelles
router.get("/export", async (req, res) => {
  try {
    const [user, sports, evenements, messages, evaluations, groupes] = await Promise.all([
      pool.query("SELECT id, email, prenom, nom, age, ville, niveau, created_at FROM users WHERE id = $1", [req.userId]),
      pool.query(`
        SELECT s.nom, s.icone FROM user_sports us
        JOIN sports s ON s.id = us.sport_id WHERE us.user_id = $1
      `, [req.userId]),
      pool.query(`
        SELECT e.titre, e.ville, e.date_evenement, ep.statut, ep.joined_at
        FROM evenement_participants ep
        JOIN evenements e ON e.id = ep.evenement_id
        WHERE ep.user_id = $1
      `, [req.userId]),
      pool.query(`
        SELECT contenu, created_at,
          CASE WHEN expediteur_id = $1 THEN 'envoyé' ELSE 'reçu' END as direction
        FROM messages WHERE expediteur_id = $1 OR destinataire_id = $1
        ORDER BY created_at DESC LIMIT 100
      `, [req.userId]),
      pool.query(`
        SELECT note, commentaire, created_at FROM evaluations WHERE evalue_id = $1
      `, [req.userId]),
      pool.query(`
        SELECT g.nom, g.description, gm.role, gm.joined_at
        FROM groupe_membres gm JOIN groupes g ON g.id = gm.groupe_id
        WHERE gm.user_id = $1
      `, [req.userId]),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      informations_personnelles: user.rows[0],
      sports_pratiques: sports.rows,
      evenements: evenements.rows,
      messages: messages.rows,
      evaluations_recues: evaluations.rows,
      groupes: groupes.rows,
    };

    // Log audit
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [req.userId, "EXPORT_DONNEES", "Export RGPD demandé"]
    );

    res.setHeader("Content-Disposition", "attachment; filename=mes-donnees-sportconnect.json");
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rgpd/supprimer-compte — droit à l'oubli
router.delete("/supprimer-compte", async (req, res) => {
  try {
    const { password } = req.body;

    // Vérifie le mot de passe avant suppression
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (!user.rows[0]) return res.status(404).json({ error: "Utilisateur introuvable" });

    const bcrypt = require("bcryptjs");

    // Si compte Google, pas de vérification mot de passe
    if (user.rows[0].password !== "google_oauth") {
      const valid = await bcrypt.compare(password, user.rows[0].password);
      if (!valid) return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Log avant suppression
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [req.userId, "SUPPRESSION_COMPTE", `Compte supprimé : ${user.rows[0].email}`]
    );

    // Supprime le compte (CASCADE supprime tout le reste)
    await pool.query("DELETE FROM users WHERE id = $1", [req.userId]);

    res.json({ message: "Compte supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rgpd/logs — historique des actions (admin)
router.get("/logs", async (req, res) => {
  try {
    const user = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
    if (user.rows[0]?.role !== "admin") return res.status(403).json({ error: "Accès refusé" });

    const result = await pool.query(`
      SELECT al.*, u.email, u.prenom, u.nom
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
