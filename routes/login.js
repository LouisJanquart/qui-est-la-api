const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");

// POST /api/admin/login
router.post("/", (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  db.get(
    "SELECT * FROM admins WHERE email = ?",
    [email],
    async (err, admin) => {
      if (err) return res.status(500).json({ error: "Erreur DB" });
      if (!admin)
        return res.status(401).json({ error: "Identifiants invalides" });

      const match = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
      if (!match)
        return res.status(401).json({ error: "Identifiants invalides" });

      // Authentification réussie
      req.session.adminId = admin.id;
      res.json({
        message: "Connexion réussie",
        admin: { id: admin.id, email: admin.email },
      });
    }
  );
});

// GET /api/admin/me
router.get("/me", (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Non connecté" });
  }

  db.get(
    "SELECT id, email FROM admins WHERE id = ?",
    [req.session.adminId],
    (err, admin) => {
      if (err) return res.status(500).json({ error: "Erreur DB" });
      if (!admin) return res.status(401).json({ error: "Non connecté" });
      res.json(admin);
    }
  );
});

// POST /api/admin/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Erreur logout" });
    res.json({ success: true });
  });
});

module.exports = router;
