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

// GET /api/profil — récupère le profil complet
router.get("/", async (req, res) => {
  try {
    const user = await pool.query(
    "SELECT id, email, nom, prenom, age, ville, niveau, photo, role, email_verifie, deux_fa_actif FROM users WHERE id = $1",
      [req.userId]
    );

    const sports = await pool.query(
      `SELECT s.id, s.nom, s.icone FROM sports s
       JOIN user_sports us ON us.sport_id = s.id
       WHERE us.user_id = $1`,
      [req.userId]
    );

    res.json({ ...user.rows[0], sports: sports.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profil — met à jour le profil
router.put("/", async (req, res) => {
  try {
    const { nom, prenom, age, ville, niveau } = req.body;

    await pool.query(
      `UPDATE users SET nom=$1, prenom=$2, age=$3, ville=$4, niveau=$5
       WHERE id=$6`,
      [nom, prenom, age, ville, niveau, req.userId]
    );

    res.json({ message: "Profil mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profil/sports — liste tous les sports disponibles
router.get("/sports", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sports ORDER BY nom");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profil/sports — met à jour les sports favoris
router.put("/sports", async (req, res) => {
  try {
    const { sportIds } = req.body;

    // Supprime les anciens sports
    await pool.query("DELETE FROM user_sports WHERE user_id = $1", [req.userId]);

    // Insère les nouveaux
    for (const sportId of sportIds) {
      await pool.query(
        "INSERT INTO user_sports (user_id, sport_id) VALUES ($1, $2)",
        [req.userId, sportId]
      );
    }

    res.json({ message: "Sports mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
