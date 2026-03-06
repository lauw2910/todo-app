const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const { sendEmail } = require("../email");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, nom, prenom } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, nom, prenom)
       VALUES ($1, $2, $3, $4) RETURNING id, email, nom, prenom, role`,
      [email, hashedPassword, nom || "", prenom || ""]
    );
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({
      token,
      user: {
        id: user.id, email: user.email,
        nom: user.nom, prenom: user.prenom,
        ville: user.ville, niveau: user.niveau,
        role: user.role,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    // Toujours répondre OK pour ne pas révéler si l'email existe
    if (result.rows.length === 0) {
      return res.json({ message: "Si cet email existe, un lien a été envoyé." });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await pool.query(
      "DELETE FROM password_resets WHERE email = $1",
      [email]
    );
    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    const resetUrl = `http://${process.env.APP_URL || "localhost"}?reset=${token}`;

    await sendEmail(
      email,
      "🔒 Réinitialisation de ton mot de passe SportConnect",
      "Réinitialise ton mot de passe",
      `<p>Bonjour <strong>${user.prenom}</strong>,</p>
       <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous :</p>
       <a href="${resetUrl}" class="cta">🔒 Réinitialiser mon mot de passe →</a>
       <p style="color: #FF3D57; font-size: 0.85rem;">⚠️ Ce lien expire dans <strong>1 heure</strong>.</p>
       <p style="color: #4a5568; font-size: 0.85rem;">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>`
    );

    res.json({ message: "Si cet email existe, un lien a été envoyé." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Lien invalide ou expiré" });
    }

    const { email } = result.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
