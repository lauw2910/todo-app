const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const profilRoutes = require("./routes/profil");
const joueursRoutes = require("./routes/joueurs");
const evenementsRoutes = require("./routes/evenements");
const messagesRoutes = require("./routes/messages");
const evaluationsRoutes = require("./routes/evaluations");
const adminRoutes = require("./routes/admin");
const statsRoutes = require("./routes/stats");
const photoRoutes = require("./routes/photo");
const groupesRoutes = require("./routes/groupes");
const googleRoutes = require("./routes/google");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("/uploads"));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleRoutes);
app.use("/api/profil", profilRoutes);
app.use("/api/profil/photo", photoRoutes);
app.use("/api/joueurs", joueursRoutes);
app.use("/api/evenements", evenementsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/evaluations", evaluationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/groupes", groupesRoutes);

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(200) NOT NULL,
      nom VARCHAR(100), prenom VARCHAR(100),
      age INTEGER, ville VARCHAR(100),
      niveau VARCHAR(20) DEFAULT 'debutant',
      role VARCHAR(20) DEFAULT 'user',
      photo VARCHAR(300),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo VARCHAR(300)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sports (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) UNIQUE NOT NULL,
      icone VARCHAR(10)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sports (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, sport_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evenements (
      id SERIAL PRIMARY KEY,
      titre VARCHAR(200) NOT NULL,
      description TEXT,
      sport_id INTEGER REFERENCES sports(id),
      organisateur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ville VARCHAR(100),
      date_evenement TIMESTAMP,
      nb_places INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evenement_participants (
      evenement_id INTEGER REFERENCES evenements(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (evenement_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      expediteur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      destinataire_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      contenu TEXT NOT NULL,
      lu BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      evaluateur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      evalue_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      note INTEGER CHECK (note >= 1 AND note <= 5),
      commentaire TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (evaluateur_id, evalue_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      token VARCHAR(200) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groupes (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(200) NOT NULL,
      description TEXT,
      sport_id INTEGER REFERENCES sports(id),
      createur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ville VARCHAR(100),
      prive BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groupe_membres (
      groupe_id INTEGER REFERENCES groupes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'membre',
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (groupe_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groupe_messages (
      id SERIAL PRIMARY KEY,
      groupe_id INTEGER REFERENCES groupes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      contenu TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO sports (nom, icone) VALUES
      ('Football', '⚽'), ('Tennis', '🎾'), ('Basketball', '🏀'),
      ('Running', '🏃'), ('Natation', '🏊'), ('Cyclisme', '🚴'),
      ('Volleyball', '🏐'), ('Badminton', '🏸'), ('Rugby', '🏉'),
      ('Randonnée', '🥾'), ('Padel', '🎾'), ('Golf', '⛳'),
      ('Boxe', '🥊'), ('Yoga', '🧘'), ('Escalade', '🧗'),
      ('Ski', '⛷️'), ('Surf', '🏄'), ('Handball', '🤾'),
      ('Judo', '🥋'), ('Pétanque', '🎯')
    ON CONFLICT (nom) DO NOTHING
  `);

  console.log("✓ Base de données prête");
}

app.listen(PORT, async () => {
  await initDB();
  console.log(`✓ Backend démarré sur le port ${PORT}`);
});
