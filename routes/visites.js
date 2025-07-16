const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/visites/actives
router.get("/actives", (req, res) => {
  const db = require("../db");

  const query = `
  SELECT 
    visites.id AS visite_id,
    visiteurs.id AS visiteur_id,
    visiteurs.nom,
    visiteurs.prenom,
    visiteurs.email,
    visites.type_visite,
    visites.date_heure_entree,
    employes.nom AS employe_nom,
    employes.local AS employe_local,
    formations.intitule AS formation_nom,
    formations.local AS formation_local
  FROM visites
  JOIN visiteurs ON visiteurs.id = visites.visiteur_id
  LEFT JOIN employes ON employes.id = visites.employe_id
  LEFT JOIN formations ON formations.id = visites.formation_id
  WHERE visites.date_heure_sortie IS NULL
  ORDER BY visites.date_heure_entree DESC
`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erreur DB (visites actives)." });
    }

    // Remap les résultats pour homogénéiser les noms de champs
    const enrichedRows = rows.map((row) => ({
      visite_id: row.visite_id,
      visiteur_id: row.visiteur_id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      type_visite: row.type_visite,
      date_heure_entree: row.date_heure_entree,
      local:
        row.type_visite === "personnel"
          ? row.employe_local
          : row.formation_local,
      a_visiter:
        row.type_visite === "personnel" ? row.employe_nom : row.formation_nom,
    }));

    res.json(enrichedRows);
  });
});

router.get("/historique", (req, res) => {
  const query = `
    SELECT 
      visites.id AS visite_id,
      visiteurs.nom,
      visiteurs.prenom,
      visiteurs.email,
      visites.type_visite,
      visites.date_heure_entree,
      visites.date_heure_sortie,
      employes.nom AS nom_employe,
      employes.local AS local_employe,
      formations.intitule AS nom_formation,
      formations.local AS local_formation
    FROM visites
    JOIN visiteurs ON visiteurs.id = visites.visiteur_id
    LEFT JOIN employes ON employes.id = visites.employe_id
    LEFT JOIN formations ON formations.id = visites.formation_id
    WHERE visites.date_heure_sortie IS NOT NULL
    ORDER BY visites.date_heure_sortie DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erreur DB (historique des visites)" });
    }

    const results = rows.map((row) => ({
      id: row.visite_id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      type_visite: row.type_visite,
      entree: row.date_heure_entree,
      sortie: row.date_heure_sortie,
      local:
        row.type_visite === "personnel"
          ? row.local_employe
          : row.local_formation,
      a_visiter:
        row.type_visite === "personnel" ? row.nom_employe : row.nom_formation,
    }));

    res.json(results);
  });
});

// POST /api/visites/entree
router.post("/entree", (req, res) => {
  const { nom, prenom, email, type_visite, employe_id, formation_id } =
    req.body;

  if (!nom || !prenom || !email || !type_visite) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  db.get(
    "SELECT id FROM visiteurs WHERE email = ?",
    [email],
    (err, visiteur) => {
      if (err) return res.status(500).json({ error: "Erreur DB (visiteur)." });

      const visiteur_id = visiteur?.id;

      const handleVisite = (idVisiteur, visiteurData) => {
        const date_heure_entree = new Date().toISOString();

        db.run(
          `INSERT INTO visites (visiteur_id, type_visite, date_heure_entree, employe_id, formation_id)
     VALUES (?, ?, ?, ?, ?)`,
          [
            idVisiteur,
            type_visite,
            date_heure_entree,
            employe_id || null,
            formation_id || null,
          ],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Erreur DB (visite)." });
            }

            const visite_id = this.lastID;

            if (type_visite === "personnel") {
              db.get(
                `SELECT nom, local FROM employes WHERE id = ?`,
                [employe_id],
                (err, employe) => {
                  if (err || !employe) {
                    return res
                      .status(500)
                      .json({ error: "Erreur DB (employé)." });
                  }

                  res.status(201).json({
                    message: "Entrée enregistrée",
                    visiteur_id: idVisiteur,
                    visite_id,
                    nom: visiteurData.nom,
                    prenom: visiteurData.prenom,
                    local: employe.local,
                    a_visiter: employe.nom,
                  });
                }
              );
            } else if (type_visite === "formation") {
              db.get(
                `SELECT intitule, local FROM formations WHERE id = ?`,
                [formation_id],
                (err, formation) => {
                  if (err || !formation) {
                    return res
                      .status(500)
                      .json({ error: "Erreur DB (formation)." });
                  }

                  res.status(201).json({
                    message: "Entrée enregistrée",
                    visiteur_id: idVisiteur,
                    visite_id,
                    nom: visiteurData.nom,
                    prenom: visiteurData.prenom,
                    local: formation.local,
                    a_visiter: formation.intitule,
                  });
                }
              );
            } else {
              res.status(400).json({ error: "Type de visite inconnu." });
            }
          }
        );
      };

      if (visiteur_id) {
        handleVisite(visiteur_id, { nom, prenom });
      } else {
        db.run(
          "INSERT INTO visiteurs (nom, prenom, email) VALUES (?, ?, ?)",
          [nom, prenom, email],
          function (err) {
            if (err)
              return res
                .status(500)
                .json({ error: "Erreur DB (création visiteur)." });
            handleVisite(this.lastID, { nom, prenom });
          }
        );
      }
    }
  );
});

// POST /api/visites/sortie
router.post("/sortie", (req, res) => {
  const { visiteur_id } = req.body;

  if (!visiteur_id) {
    return res.status(400).json({ error: "visiteur_id requis" });
  }

  const dateSortie = new Date().toISOString();

  const db = require("../db");

  db.get(
    `SELECT id FROM visites
     WHERE visiteur_id = ? AND date_heure_sortie IS NULL
     ORDER BY date_heure_entree DESC LIMIT 1`,
    [visiteur_id],
    (err, visite) => {
      if (err)
        return res.status(500).json({ error: "Erreur DB (recherche visite)." });

      if (!visite) {
        return res
          .status(404)
          .json({ error: "Aucune visite active trouvée pour ce visiteur." });
      }

      db.run(
        `UPDATE visites SET date_heure_sortie = ?
         WHERE id = ?`,
        [dateSortie, visite.id],
        function (err) {
          if (err)
            return res.status(500).json({ error: "Erreur DB (mise à jour)." });

          res.json({
            message: "Sortie enregistrée avec succès",
            visite_id: visite.id,
            date_heure_sortie: dateSortie,
          });
        }
      );
    }
  );
});

module.exports = router;
