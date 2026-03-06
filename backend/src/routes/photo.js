const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
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

const storage = multer.diskStorage({
  destination: "/uploads",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format non supporté"));
  },
});

// POST /api/profil/photo
router.post("/", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier" });

    const photoUrl = `/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE users SET photo = $1 WHERE id = $2",
      [photoUrl, req.userId]
    );

    res.json({ photo: photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
