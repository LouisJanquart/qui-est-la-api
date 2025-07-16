const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/employes
router.get("/", (req, res) => {
  const query = `
    SELECT 
      id, 
      prenom, 
      nom, 
      email, 
      telephone, 
      fonction, 
      local 
    FROM employes
    ORDER BY nom, prenom
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erreur DB (employes)." });
    }
    res.json(rows);
  });
});

// GET /api/employes/formateurs
router.get("/formateurs", (req, res) => {
  db.all(
    `SELECT id, prenom, nom FROM employes WHERE fonction = 'formateur' ORDER BY nom`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur DB." });
      res.json(rows);
    }
  );
});

// POST /api/employes
router.post("/", (req, res) => {
  const { nom, prenom, email, telephone, fonction, local } = req.body;

  if (!nom || !prenom || !email || !fonction || !local) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  const query = `
    INSERT INTO employes (nom, prenom, email, telephone, fonction, local)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [nom, prenom, email, telephone || null, fonction, local],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erreur lors de l'ajout." });
      }

      res.status(201).json({ message: "Employé ajouté", id: this.lastID });
    }
  );
});

// PUT /api/employes/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, telephone, fonction, local } = req.body;

  if (!nom || !prenom || !email || !fonction || !local) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  const query = `
    UPDATE employes
    SET nom = ?, prenom = ?, email = ?, telephone = ?, fonction = ?, local = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [nom, prenom, email, telephone || null, fonction, local, id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erreur lors de la mise à jour." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Employé non trouvé." });
      }

      res.json({ message: "Employé mis à jour" });
    }
  );
});

// DELETE /api/employes/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM employes WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la suppression." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Employé non trouvé." });
    }

    res.json({ message: "Employé supprimé" });
  });
});

module.exports = router;
