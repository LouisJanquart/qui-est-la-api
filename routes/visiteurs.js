const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/visiteurs/:id
router.get("/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM visiteurs WHERE id = ?", [id], (err, visiteur) => {
    if (err) return res.status(500).json({ error: "Erreur DB." });
    if (!visiteur)
      return res.status(404).json({ error: "Visiteur non trouvé." });
    res.json(visiteur);
  });
});

// GET /api/visiteurs/email/:email
router.get("/email/:email", (req, res) => {
  const email = req.params.email;

  db.get(
    `SELECT * FROM visiteurs WHERE email = ?`,
    [email],
    (err, visiteur) => {
      if (err) {
        return res.status(500).json({ error: "Erreur DB." });
      }

      if (!visiteur) {
        return res.status(404).json({ error: "Visiteur non trouvé." });
      }

      res.json(visiteur);
    }
  );
});

module.exports = router;
