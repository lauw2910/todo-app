const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { emailNouvelleEvaluation } = require("../email");

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

// GET /api/evaluations/:userId
router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.prenom, u.nom,
        ROUND(AVG(e2.note) OVER (), 1) as moyenne,
        COUNT(e2.id) OVER () as total
      FROM evaluations e
      JOIN users u ON u.id = e.evaluateur_id
      LEFT JOIN evaluations e2 ON e2.evalue_id = $1
      WHERE e.evalue_id = $1
      ORDER BY e.created_at DESC
    `, [req.params.userId]);

    const moyenne = result.rows[0]?.moyenne || 0;
    const total = result.rows[0]?.total || 0;
    res.json({ moyenne, total, evaluations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evaluations/:userId
router.post("/:userId", async (req, res) => {
  try {
    const { note, commentaire } = req.body;
    const evalueId = req.params.userId;

    if (parseInt(evalueId) === req.userId) {
      return res.status(400).json({ error: "Tu ne peux pas te noter toi-même" });
    }

    await pool.query(`
      INSERT INTO evaluations (evaluateur_id, evalue_id, note, commentaire)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (evaluateur_id, evalue_id)
      DO UPDATE SET note = $3, commentaire = $4, created_at = NOW()
    `, [req.userId, evalueId, note, commentaire]);

    // Envoyer email
    const [evaluateur, evalue] = await Promise.all([
      pool.query("SELECT prenom, nom FROM users WHERE id = $1", [req.userId]),
      pool.query("SELECT prenom, nom, email FROM users WHERE id = $1", [evalueId]),
    ]);
    emailNouvelleEvaluation(evalue.rows[0], evaluateur.rows[0], note);

    res.json({ message: "Évaluation enregistrée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
