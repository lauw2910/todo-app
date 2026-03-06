const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { emailEvenementRejoint } = require("../email");

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

// GET /api/evenements
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        u.prenom || ' ' || u.nom as organisateur,
        s.nom as sport_nom, s.icone as sport_icone,
        COUNT(ep.user_id) FILTER (WHERE ep.statut = 'accepte') as nb_participants,
        MAX(ep.statut) FILTER (WHERE ep.user_id = $1) as mon_statut,
        BOOL_OR(ep.user_id = $1) as est_inscrit
      FROM evenements e
      JOIN users u ON u.id = e.organisateur_id
      JOIN sports s ON s.id = e.sport_id
      LEFT JOIN evenement_participants ep ON ep.evenement_id = e.id
      GROUP BY e.id, u.prenom, u.nom, s.nom, s.icone
      ORDER BY e.date_evenement ASC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evenements/:id/participants
router.get("/:id/participants", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.prenom, u.nom, u.photo, u.niveau, u.ville,
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

// POST /api/evenements
router.post("/", async (req, res) => {
  try {
    const { titre, sport_id, ville, date_evenement, nb_places, description } = req.body;
    const result = await pool.query(`
      INSERT INTO evenements (titre, sport_id, ville, date_evenement, nb_places, description, organisateur_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [titre, sport_id, ville, date_evenement, nb_places, description, req.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evenements/:id/rejoindre
router.post("/:id/rejoindre", async (req, res) => {
  try {
    // Vérifie si l'événement nécessite une approbation
    const evenement = await pool.query(
      "SELECT * FROM evenements WHERE id = $1", [req.params.id]
    );

    const statut = evenement.rows[0]?.approbation ? "en_attente" : "accepte";

    await pool.query(
      "INSERT INTO evenement_participants (evenement_id, user_id, statut) VALUES ($1, $2, $3) ON CONFLICT (evenement_id, user_id) DO UPDATE SET statut = $3",
      [req.params.id, req.userId, statut]
    );

    const [ev, participant] = await Promise.all([
      pool.query(`
        SELECT e.titre, e.ville, u.prenom, u.nom, u.email
        FROM evenements e
        JOIN users u ON u.id = e.organisateur_id
        WHERE e.id = $1
      `, [req.params.id]),
      pool.query("SELECT prenom, nom FROM users WHERE id = $1", [req.userId]),
    ]);

    if (ev.rows[0] && participant.rows[0]) {
      emailEvenementRejoint(
        { email: ev.rows[0].email, prenom: ev.rows[0].prenom },
        participant.rows[0],
        { titre: ev.rows[0].titre, ville: ev.rows[0].ville }
      );
    }

    res.json({ message: "Inscrit avec succès", statut });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/evenements/:id/participants/:userId — accepter/refuser
router.put("/:id/participants/:userId", async (req, res) => {
  try {
    const { statut } = req.body; // accepte ou refuse

    // Vérifie que c'est bien l'organisateur
    const evenement = await pool.query(
      "SELECT organisateur_id FROM evenements WHERE id = $1", [req.params.id]
    );
    if (evenement.rows[0]?.organisateur_id !== req.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query(
      "UPDATE evenement_participants SET statut = $1 WHERE evenement_id = $2 AND user_id = $3",
      [statut, req.params.id, req.params.userId]
    );

    res.json({ message: `Participant ${statut}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/evenements/:id/quitter
router.delete("/:id/quitter", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM evenement_participants WHERE evenement_id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    res.json({ message: "Désinscrit avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
