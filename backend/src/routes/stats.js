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

// GET /api/stats
router.get("/", async (req, res) => {
  try {
    const id = req.userId;

    const [
      messages,
      conversations,
      evenements,
      sports,
      evaluation,
      evaluationsDonnees,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM messages WHERE expediteur_id = $1", [id]),
      pool.query(`
        SELECT COUNT(DISTINCT CASE WHEN expediteur_id = $1 THEN destinataire_id ELSE expediteur_id END)
        FROM messages WHERE expediteur_id = $1 OR destinataire_id = $1
      `, [id]),
      pool.query("SELECT COUNT(*) FROM evenement_participants WHERE user_id = $1", [id]),
      pool.query("SELECT COUNT(*) FROM user_sports WHERE user_id = $1", [id]),
      pool.query("SELECT ROUND(AVG(note),1) as moyenne, COUNT(*) as total FROM evaluations WHERE evalue_id = $1", [id]),
      pool.query("SELECT COUNT(*) FROM evaluations WHERE evaluateur_id = $1", [id]),
    ]);

    res.json({
      messages_envoyes: parseInt(messages.rows[0].count),
      conversations: parseInt(conversations.rows[0].count),
      evenements_rejoints: parseInt(evenements.rows[0].count),
      sports_pratiques: parseInt(sports.rows[0].count),
      note_moyenne: evaluation.rows[0].moyenne || 0,
      nb_avis: parseInt(evaluation.rows[0].total),
      evaluations_donnees: parseInt(evaluationsDonnees.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
