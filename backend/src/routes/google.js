const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `https://${process.env.APP_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const prenom = profile.name.givenName;
    const nom = profile.name.familyName;
    const photo = profile.photos[0]?.value;

    // Cherche si l'utilisateur existe déjà
    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      // Crée le compte automatiquement
      result = await pool.query(`
        INSERT INTO users (email, password, prenom, nom, photo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [email, "google_oauth", prenom, nom || "", photo || null]);
    } else {
      // Met à jour la photo si elle vient de Google
      if (photo && !result.rows[0].photo) {
        await pool.query("UPDATE users SET photo = $1 WHERE id = $2", [photo, result.rows[0].id]);
        result.rows[0].photo = photo;
      }
    }

    return done(null, result.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

// GET /api/auth/google
router.get("/", passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
}));

// GET /api/auth/google/callback
router.get("/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/?error=google" }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      photo: user.photo,
      role: user.role,
    }));

    // Redirige vers le frontend avec le token
    res.redirect(`https://${process.env.APP_URL}/?token=${token}&user=${userData}`);
  }
);

module.exports = router;
