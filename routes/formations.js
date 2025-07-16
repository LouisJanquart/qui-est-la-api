const express = require("express");
const router = express.Router();
const db = require("../db");

// GET toutes les formations
router.get("/", (req, res) => {
  const sql = `
    SELECT f.*, e.prenom AS formateur_prenom, e.nom AS formateur_nom
    FROM formations f
    LEFT JOIN employes e ON f.formateur_id = e.id
    ORDER BY f.date_debut DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erreur réelle :", err);
      return res.status(500).json({ error: "Erreur chargement formations" });
    }
    res.json(rows);
  });
});

// POST une nouvelle formation
router.post("/", (req, res) => {
  const { intitule, date_debut, date_fin, formateur_id, local } = req.body;

  if (!intitule || !date_debut || !date_fin || !formateur_id || !local) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const sql = `
    INSERT INTO formations (intitule, date_debut, date_fin, formateur_id, local)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [intitule, date_debut, date_fin, formateur_id, local],
    function (err) {
      if (err) {
        console.error("Erreur ajout formation :", err);
        return res.status(500).json({ error: "Erreur ajout formation" });
      }

      // Retourner la formation ajoutée
      db.get(
        `SELECT * FROM formations WHERE id = ?`,
        [this.lastID],
        (err2, formation) => {
          if (err2) {
            return res
              .status(500)
              .json({ error: "Erreur récupération formation" });
          }
          res.status(201).json(formation);
        }
      );
    }
  );
});

// PUT mise à jour d'une formation
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { intitule, date_debut, date_fin, formateur_id, local } = req.body;

  const sql = `
    UPDATE formations
    SET intitule = ?, date_debut = ?, date_fin = ?, formateur_id = ?, local = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [intitule, date_debut, date_fin, formateur_id, local, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erreur mise à jour formation" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Formation non trouvée" });
      }

      res.json({ success: true });
    }
  );
});

// DELETE une formation
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM formations WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Erreur suppression formation" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Formation non trouvée" });
    }

    res.json({ success: true });
  });
});

module.exports = router;
