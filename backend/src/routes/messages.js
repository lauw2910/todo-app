const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { emailNouveauMessage } = require("../email");

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

// GET /api/messages — liste des conversations
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (other_user)
        CASE WHEN m.expediteur_id = $1 THEN m.destinataire_id ELSE m.expediteur_id END as other_user,
        u.prenom, u.nom,
        m.contenu as dernier_message,
        m.created_at,
        m.expediteur_id,
        COUNT(m2.id) FILTER (WHERE m2.lu = false AND m2.destinataire_id = $1) as non_lus
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.expediteur_id = $1 THEN m.destinataire_id ELSE m.expediteur_id END
      LEFT JOIN messages m2 ON m2.expediteur_id = u.id AND m2.destinataire_id = $1
      WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
      GROUP BY other_user, u.prenom, u.nom, m.contenu, m.created_at, m.expediteur_id
      ORDER BY other_user, m.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:userId — messages avec un joueur
router.get("/:userId", async (req, res) => {
  try {
    const otherId = req.params.userId;
    await pool.query(
      "UPDATE messages SET lu = true WHERE expediteur_id = $1 AND destinataire_id = $2",
      [otherId, req.userId]
    );
    const result = await pool.query(`
      SELECT m.*, u.prenom, u.nom
      FROM messages m
      JOIN users u ON u.id = m.expediteur_id
      WHERE (m.expediteur_id = $1 AND m.destinataire_id = $2)
         OR (m.expediteur_id = $2 AND m.destinataire_id = $1)
      ORDER BY m.created_at ASC
    `, [req.userId, otherId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:userId — envoyer un message
router.post("/:userId", async (req, res) => {
  try {
    const { contenu } = req.body;
    const destinataireId = req.params.userId;

    const result = await pool.query(`
      INSERT INTO messages (expediteur_id, destinataire_id, contenu)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.userId, destinataireId, contenu]);

    // Envoyer email si premier message non lu
    const nonLus = await pool.query(`
      SELECT COUNT(*) FROM messages
      WHERE expediteur_id = $1 AND destinataire_id = $2 AND lu = false
    `, [req.userId, destinataireId]);

    if (parseInt(nonLus.rows[0].count) === 1) {
      const [expediteur, destinataire] = await Promise.all([
        pool.query("SELECT prenom, nom FROM users WHERE id = $1", [req.userId]),
        pool.query("SELECT prenom, nom, email FROM users WHERE id = $1", [destinataireId]),
      ]);
      emailNouveauMessage(destinataire.rows[0], expediteur.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
