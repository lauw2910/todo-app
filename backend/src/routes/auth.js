const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const { sendEmail } = require("../email");

const router = express.Router();

// Fonction log
async function log(userId, action, details, req) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, details, ip) VALUES ($1, $2, $3, $4)",
      [userId, action, details, ip]
    );
  } catch (err) {
    console.error("Erreur log:", err.message);
  }
}

// Règles de validation
const registerRules = [
  body("email")
    .isEmail().withMessage("Email invalide")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Email trop long"),
  body("password")
    .isLength({ min: 8 }).withMessage("Mot de passe minimum 8 caractères")
    .matches(/[A-Z]/).withMessage("Le mot de passe doit contenir une majuscule")
    .matches(/[0-9]/).withMessage("Le mot de passe doit contenir un chiffre")
    .isLength({ max: 100 }).withMessage("Mot de passe trop long"),
  body("prenom")
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage("Prénom requis (max 50 caractères)")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage("Prénom invalide"),
  body("nom")
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage("Nom requis (max 50 caractères)")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage("Nom invalide"),
];

const loginRules = [
  body("email")
    .isEmail().withMessage("Email invalide")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Mot de passe requis")
    .isLength({ max: 100 }).withMessage("Mot de passe trop long"),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array().map(e => e.msg),
    });
  }
  next();
}

// POST /api/auth/register
router.post("/register", registerRules, validate, async (req, res) => {
  try {
    const { email, password, nom, prenom } = req.body;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailToken = crypto.randomBytes(32).toString("hex");

    const result = await pool.query(
      `INSERT INTO users (email, password, nom, prenom, email_token, email_verifie)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING id, email, nom, prenom, role`,
      [email, hashedPassword, nom, prenom, emailToken]
    );

    const user = result.rows[0];

    // Envoi email de vérification
    const verifyUrl = `https://${process.env.APP_URL || "localhost"}?verify=${emailToken}`;
    await sendEmail(
      email,
      "✅ Vérifie ton adresse email SportConnect",
      "Vérifie ton adresse email",
      `<p>Bonjour <strong>${prenom}</strong>,</p>
       <p>Bienvenue sur SportConnect ! Clique sur le bouton ci-dessous pour vérifier ton adresse email :</p>
       <a href="${verifyUrl}" class="cta">✅ Vérifier mon email →</a>
       <p style="color: #4a5568; font-size: 0.85rem;">Ce lien expire dans 24 heures.</p>`
    );

    await log(user.id, "REGISTER", `Inscription : ${email}`, req);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({
      token, user,
      message: "Compte créé ! Vérifie ton email pour activer ton compte.",
      emailVerificationRequired: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify-email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token manquant" });

    const result = await pool.query(
      "UPDATE users SET email_verifie = true, email_token = NULL WHERE email_token = $1 RETURNING id, email",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Token invalide ou déjà utilisé" });
    }

    await log(result.rows[0].id, "EMAIL_VERIFIE", `Email vérifié : ${result.rows[0].email}`, req);

    res.json({ message: "Email vérifié avec succès ! Tu peux maintenant te connecter." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", loginRules, validate, async (req, res) => {
  try {
    const { email, password, code2fa } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      await log(null, "LOGIN_FAILED", `Tentative échouée : ${email} (email inconnu)`, req);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      await log(user.id, "LOGIN_FAILED", `Tentative échouée : ${email} (mauvais mot de passe)`, req);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

   // Vérification email obligatoire
    if (!user.email_verifie) {
      await log(user.id, "LOGIN_FAILED", `Connexion refusée : email non vérifié (${email})`, req);
      return res.status(401).json({
        error: "Tu dois vérifier ton email avant de te connecter. Vérifie ta boîte mail.",
        emailNotVerified: true,
      });
    } 

   // Vérification 2FA si activé
    if (user.deux_fa_actif) {
      if (!code2fa) {
        // Génère et envoie le code 2FA
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
          "UPDATE users SET deux_fa_code = $1, deux_fa_expires = $2 WHERE id = $3",
          [code, expires, user.id]
        );

        await sendEmail(
          email,
          "🔐 Code de connexion SportConnect",
          "Ton code de connexion",
          `<p>Bonjour <strong>${user.prenom}</strong>,</p>
           <p>Ton code de vérification à usage unique :</p>
           <div style="font-size: 2.5rem; font-weight: 900; color: #0057FF; text-align: center;
             background: #f0f4ff; padding: 1.5rem; border-radius: 12px; letter-spacing: 8px;">
             ${code}
           </div>
           <p style="color: #FF3D57; font-size: 0.85rem;">⚠️ Ce code expire dans <strong>10 minutes</strong>.</p>
           <p style="color: #4a5568; font-size: 0.85rem;">Si tu n'as pas tenté de te connecter, change ton mot de passe immédiatement.</p>`
        );

        await log(user.id, "2FA_CODE_ENVOYE", `Code 2FA envoyé à ${email}`, req);

        return res.status(202).json({
          requires2FA: true,
          message: "Code de vérification envoyé par email",
        });
      }

      // Vérifie le code 2FA
      if (
        user.deux_fa_code !== code2fa ||
        !user.deux_fa_expires ||
        new Date() > new Date(user.deux_fa_expires)
      ) {
        await log(user.id, "2FA_FAILED", `Code 2FA invalide pour ${email}`, req);
        return res.status(401).json({ error: "Code invalide ou expiré" });
      }

      // Invalide le code après utilisation
      await pool.query(
        "UPDATE users SET deux_fa_code = NULL, deux_fa_expires = NULL WHERE id = $1",
        [user.id]
      );
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    await log(user.id, "LOGIN", `Connexion réussie : ${email}`, req);

    res.json({
      token,
      user: {
        id: user.id, email: user.email,
        nom: user.nom, prenom: user.prenom,
        ville: user.ville, niveau: user.niveau,
        role: user.role,
        email_verifie: user.email_verifie,
        deux_fa_actif: user.deux_fa_actif,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/toggle-2fa — activer/désactiver le 2FA
router.post("/toggle-2fa", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);
    if (!user.rows[0]) return res.status(404).json({ error: "Utilisateur introuvable" });

    const newState = !user.rows[0].deux_fa_actif;
    await pool.query("UPDATE users SET deux_fa_actif = $1 WHERE id = $2", [newState, decoded.userId]);

    await log(decoded.userId, newState ? "2FA_ACTIVE" : "2FA_DESACTIVE",
      `2FA ${newState ? "activé" : "désactivé"}`, req);

    res.json({
      message: `2FA ${newState ? "activé" : "désactivé"}`,
      deux_fa_actif: newState,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email invalide" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({ message: "Si cet email existe, un lien a été envoyé." });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);
    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    const resetUrl = `https://${process.env.APP_URL || "localhost"}?reset=${token}`;

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

    await log(user.id, "PASSWORD_RESET", `Demande de réinitialisation : ${email}`, req);
    res.json({ message: "Si cet email existe, un lien a été envoyé." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Mot de passe minimum 8 caractères" });
    }

    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Lien invalide ou expiré" });
    }

    const { email } = result.rows[0];
    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    await log(user.rows[0]?.id, "PASSWORD_CHANGED", `Mot de passe changé : ${email}`, req);

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
