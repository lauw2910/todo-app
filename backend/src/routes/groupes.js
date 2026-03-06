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

// GET /api/groupes
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*,
        s.nom as sport_nom, s.icone as sport_icone,
        u.prenom || ' ' || u.nom as createur,
        COUNT(DISTINCT gm.user_id) as nb_membres,
        BOOL_OR(gm.user_id = $1) as est_membre
      FROM groupes g
      JOIN sports s ON s.id = g.sport_id
      JOIN users u ON u.id = g.createur_id
      LEFT JOIN groupe_membres gm ON gm.groupe_id = g.id
      GROUP BY g.id, s.nom, s.icone, u.prenom, u.nom
      ORDER BY g.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groupes
router.post("/", async (req, res) => {
  try {
    const { nom, description, sport_id, ville, prive } = req.body;
    const result = await pool.query(`
      INSERT INTO groupes (nom, description, sport_id, createur_id, ville, prive)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [nom, description, sport_id, req.userId, ville, prive || false]);

    await pool.query(`
      INSERT INTO groupe_membres (groupe_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `, [result.rows[0].id, req.userId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groupes/:id/rejoindre
router.post("/:id/rejoindre", async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO groupe_membres (groupe_id, user_id, role)
      VALUES ($1, $2, 'membre')
      ON CONFLICT DO NOTHING
    `, [req.params.id, req.userId]);
    res.json({ message: "Groupe rejoint !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groupes/:id/quitter
router.delete("/:id/quitter", async (req, res) => {
  try {
    await pool.query(`
      DELETE FROM groupe_membres
      WHERE groupe_id = $1 AND user_id = $2
    `, [req.params.id, req.userId]);
    res.json({ message: "Groupe quitté" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groupes/:id/membres
router.get("/:id/membres", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.prenom, u.nom, u.photo, u.niveau, u.ville,
        gm.role, gm.joined_at
      FROM groupe_membres gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.groupe_id = $1
      ORDER BY gm.role DESC, gm.joined_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groupes/:id/messages
router.get("/:id/messages", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gm.*, u.prenom, u.nom, u.photo
      FROM groupe_messages gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.groupe_id = $1
      ORDER BY gm.created_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groupes/:id/messages
router.post("/:id/messages", async (req, res) => {
  try {
    const { contenu } = req.body;
    const result = await pool.query(`
      INSERT INTO groupe_messages (groupe_id, user_id, contenu)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.params.id, req.userId, contenu]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groupes/:id
router.delete("/:id", async (req, res) => {
  try {
    const groupe = await pool.query("SELECT createur_id FROM groupes WHERE id = $1", [req.params.id]);
    if (!groupe.rows[0]) return res.status(404).json({ error: "Groupe introuvable" });

    const user = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
    const isAdmin = user.rows[0]?.role === "admin";
    const isCreateur = groupe.rows[0].createur_id === req.userId;

    if (!isAdmin && !isCreateur) return res.status(403).json({ error: "Non autorisé" });

    await pool.query("DELETE FROM groupes WHERE id = $1", [req.params.id]);
    res.json({ message: "Groupe supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
