const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// Middleware auth + admin
async function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    const user = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
    if (user.rows[0]?.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

router.use(adminAuth);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const sports = await pool.query("SELECT COUNT(*) FROM user_sports");
    const evenements = await pool.query("SELECT COUNT(*) FROM evenements");
    const messages = await pool.query("SELECT COUNT(*) FROM messages");
    const evaluations = await pool.query("SELECT COUNT(*), ROUND(AVG(note),1) as moyenne FROM evaluations");

    res.json({
      users: parseInt(users.rows[0].count),
      sports: parseInt(sports.rows[0].count),
      evenements: parseInt(evenements.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      evaluations: parseInt(evaluations.rows[0].count),
      note_moyenne: evaluations.rows[0].moyenne || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.prenom, u.nom, u.ville, u.niveau, u.role, u.created_at,
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
router.delete("/users/:id", async (req, res) => {
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
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, req.params.id]);
    res.json({ message: "Rôle mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
