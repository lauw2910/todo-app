const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const session = require("express-session");
const http = require("http");
const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
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
const rgpdRoutes = require("./routes/rgpd");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS strict
const allowedOrigins = [
  "https://sportconnect.duckdns.org",
  "http://localhost:5173",
  "http://192.168.1.184:5173",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqué : origine non autorisée → ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Sécurité headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Trop de requêtes, réessaie dans 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Trop de tentatives de connexion, réessaie dans 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware blocage IP brute force
async function checkIPBlocked(req, res, next) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const result = await pool.query(`
      SELECT COUNT(*) as nb FROM audit_logs
      WHERE action = 'LOGIN_FAILED'
      AND ip = $1
      AND created_at > NOW() - INTERVAL '15 minutes'
    `, [ip]);
    const nb = parseInt(result.rows[0].nb);
    if (nb >= 20) {
      await pool.query(
        "INSERT INTO audit_logs (user_id, action, details, ip) VALUES ($1, $2, $3, $4)",
        [null, "IP_BLOCKED", `IP bloquée après ${nb} tentatives échouées`, ip]
      );
      return res.status(429).json({
        error: "Trop de tentatives échouées. Réessaie dans 15 minutes.",
        blocked: true,
      });
    }
    next();
  } catch (err) {
    next();
  }
}

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static("/uploads"));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  }
}));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authLimiter, checkIPBlocked, authRoutes);
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
app.use("/api/rgpd", rgpdRoutes);

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
      email_verifie BOOLEAN DEFAULT false,
      email_token VARCHAR(200),
      deux_fa_actif BOOLEAN DEFAULT false,
      deux_fa_code VARCHAR(10),
      deux_fa_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo VARCHAR(300)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verifie BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_token VARCHAR(200)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deux_fa_actif BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deux_fa_code VARCHAR(10)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deux_fa_expires TIMESTAMP`);

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
      statut VARCHAR(20) DEFAULT 'accepte',
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (evenement_id, user_id)
    )
  `);

  await pool.query(`ALTER TABLE evenement_participants ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'accepte'`);

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
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consentements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      cookies_analytics BOOLEAN DEFAULT false,
      cookies_marketing BOOLEAN DEFAULT false,
      cgu_acceptees BOOLEAN DEFAULT false,
      cgu_version VARCHAR(20) DEFAULT '1.0',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
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

// Serveur HTTP + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map des connexions : userId → ws
const clients = new Map();

wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);

      // Authentification
      if (data.type === "auth") {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          userId = decoded.userId;
          clients.set(userId, ws);
          ws.send(JSON.stringify({ type: "auth_ok", userId }));
          console.log(`[WS] User ${userId} connecté`);
        } catch {
          ws.send(JSON.stringify({ type: "auth_error" }));
          ws.close();
        }
        return;
      }

      if (!userId) return;

      // Message privé
      if (data.type === "message") {
        const { destinataire_id, contenu } = data;
        if (!destinataire_id || !contenu?.trim()) return;

        const result = await pool.query(`
          INSERT INTO messages (expediteur_id, destinataire_id, contenu)
          VALUES ($1, $2, $3) RETURNING *
        `, [userId, destinataire_id, contenu.trim()]);

        const msg = result.rows[0];
        const userInfo = await pool.query(
          "SELECT prenom, nom, photo FROM users WHERE id = $1", [userId]
        );
        const sender = userInfo.rows[0];

        const payload = JSON.stringify({
          type: "message",
          ...msg,
          prenom: sender.prenom,
          nom: sender.nom,
          photo: sender.photo,
        });

        ws.send(payload);

        const destWs = clients.get(parseInt(destinataire_id));
        if (destWs && destWs.readyState === 1) {
          destWs.send(payload);
        }
      }

      // Message de groupe
      if (data.type === "groupe_message") {
        const { groupe_id, contenu } = data;
        if (!groupe_id || !contenu?.trim()) return;

        const membre = await pool.query(
          "SELECT 1 FROM groupe_membres WHERE groupe_id = $1 AND user_id = $2",
          [groupe_id, userId]
        );
        if (!membre.rows[0]) return;

        const result = await pool.query(`
          INSERT INTO groupe_messages (groupe_id, user_id, contenu)
          VALUES ($1, $2, $3) RETURNING *
        `, [groupe_id, userId, contenu.trim()]);

        const msg = result.rows[0];
        const userInfo = await pool.query(
          "SELECT prenom, nom, photo FROM users WHERE id = $1", [userId]
        );
        const sender = userInfo.rows[0];

        const membres = await pool.query(
          "SELECT user_id FROM groupe_membres WHERE groupe_id = $1", [groupe_id]
        );

        const payload = JSON.stringify({
          type: "groupe_message",
          ...msg,
          prenom: sender.prenom,
          nom: sender.nom,
          photo: sender.photo,
        });

        membres.rows.forEach(m => {
          const memberWs = clients.get(m.user_id);
          if (memberWs && memberWs.readyState === 1) {
            memberWs.send(payload);
          }
        });
      }

      // Ping keepalive
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }

    } catch (err) {
      console.error("[WS] Erreur:", err.message);
    }
  });

  ws.on("close", () => {
    if (userId) {
      clients.delete(userId);
      console.log(`[WS] User ${userId} déconnecté`);
    }
  });

  ws.on("error", (err) => {
    console.error("[WS] Erreur socket:", err.message);
  });
});

server.listen(PORT, async () => {
  await initDB();
  console.log(`✓ Backend + WebSocket démarrés sur le port ${PORT}`);
});
