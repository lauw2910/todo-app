const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// Middleware JWT
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

// GET /api/joueurs?sport=1&ville=Paris
router.get("/", async (req, res) => {
  try {
    const { sport, ville } = req.query;

    let query = `
      SELECT DISTINCT u.id, u.nom, u.prenom, u.ville, u.niveau, u.age,
        ARRAY_AGG(s.nom) as sports,
        ARRAY_AGG(s.icone) as icones
      FROM users u
      JOIN user_sports us ON us.user_id = u.id
      JOIN sports s ON s.id = us.sport_id
      WHERE u.id != $1
    `;

    const params = [req.userId];
    let paramIndex = 2;

    if (ville) {
      query += ` AND LOWER(u.ville) LIKE LOWER($${paramIndex})`;
      params.push(`%${ville}%`);
      paramIndex++;
    }

    if (sport) {
      query += ` AND u.id IN (
        SELECT user_id FROM user_sports WHERE sport_id = $${paramIndex}
      )`;
      params.push(sport);
      paramIndex++;
    }

    query += ` GROUP BY u.id, u.nom, u.prenom, u.ville, u.niveau, u.age
               ORDER BY u.prenom`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
