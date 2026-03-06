const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    pool.query("SELECT role FROM users WHERE id = $1", [decoded.userId]).then(r => {
      if (r.rows[0]?.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
      next();
    });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

// GET /api/admin/stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [users, sports, evenements, messages, evaluations, groupes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM user_sports"),
      pool.query("SELECT COUNT(*) FROM evenements"),
      pool.query("SELECT COUNT(*) FROM messages"),
      pool.query("SELECT COUNT(*), ROUND(AVG(note),1) as moyenne FROM evaluations"),
      pool.query("SELECT COUNT(*) FROM groupes"),
    ]);
    res.json({
      users: users.rows[0].count,
      sports: sports.rows[0].count,
      evenements: evenements.rows[0].count,
      messages: messages.rows[0].count,
      evaluations: evaluations.rows[0].count,
      note_moyenne: evaluations.rows[0].moyenne || 0,
      groupes: groupes.rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.prenom, u.nom, u.ville, u.niveau, u.role, u.photo, u.created_at,
        COUNT(DISTINCT us.sport_id) as nb_sports,
        COUNT(DISTINCT m.id) as nb_messages,
        COUNT(DISTINCT ep.evenement_id) as nb_evenements
      FROM users u
      LEFT JOIN user_sports us ON us.user_id = u.id
      LEFT JOIN messages m ON m.expediteur_id = u.id
      LEFT JOIN evenement_participants ep ON ep.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ error: "Tu ne peux pas te supprimer toi-même" });
    }
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, req.params.id]);
    res.json({ message: "Rôle mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/evenements
router.get("/evenements", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        u.prenom || ' ' || u.nom as organisateur,
        u.email as organisateur_email,
        s.nom as sport_nom, s.icone as sport_icone,
        COUNT(ep.user_id) as nb_participants
      FROM evenements e
      JOIN users u ON u.id = e.organisateur_id
      JOIN sports s ON s.id = e.sport_id
      LEFT JOIN evenement_participants ep ON ep.evenement_id = e.id
      GROUP BY e.id, u.prenom, u.nom, u.email, s.nom, s.icone
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/evenements/:id/participants
router.get("/evenements/:id/participants", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.prenom, u.nom, u.photo, u.niveau, u.ville,
        ep.statut, ep.joined_at
      FROM evenement_participants ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.evenement_id = $1
      ORDER BY ep.joined_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/evenements/:id
router.delete("/evenements/:id", adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM evenements WHERE id = $1", [req.params.id]);
    res.json({ message: "Événement supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/groupes
router.get("/groupes", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*,
        s.nom as sport_nom, s.icone as sport_icone,
        u.prenom || ' ' || u.nom as createur,
        u.email as createur_email,
        COUNT(DISTINCT gm.user_id) as nb_membres
      FROM groupes g
      JOIN sports s ON s.id = g.sport_id
      JOIN users u ON u.id = g.createur_id
      LEFT JOIN groupe_membres gm ON gm.groupe_id = g.id
      GROUP BY g.id, s.nom, s.icone, u.prenom, u.nom, u.email
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/groupes/:id
router.delete("/groupes/:id", adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM groupes WHERE id = $1", [req.params.id]);
    res.json({ message: "Groupe supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
