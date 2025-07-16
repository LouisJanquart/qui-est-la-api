const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.sqlite");

db.serialize(() => {
  // Visiteurs
  db.run(`
    CREATE TABLE IF NOT EXISTS visiteurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT,
      prenom TEXT,
      email TEXT
    )
  `);

  // Employés
  db.run(`
    CREATE TABLE IF NOT EXISTS employes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT,
      prenom TEXT,
      fonction TEXT,
      local TEXT,
      telephone TEXT
    )
  `);

  // Formations
  db.run(`
    CREATE TABLE IF NOT EXISTS formations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intitule TEXT,
      date TEXT,
      local TEXT,
      formateur_id INTEGER,
      FOREIGN KEY (formateur_id) REFERENCES employes(id)
    )
  `);

  // Visites
  db.run(`
    CREATE TABLE IF NOT EXISTS visites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visiteur_id INTEGER,
      type_visite TEXT, -- "formation" ou "personnel"
      date_heure_entree TEXT,
      date_heure_sortie TEXT,
      formation_id INTEGER,
      employe_id INTEGER,
      FOREIGN KEY (visiteur_id) REFERENCES visiteurs(id),
      FOREIGN KEY (formation_id) REFERENCES formations(id),
      FOREIGN KEY (employe_id) REFERENCES employes(id)
    )
  `);

  console.log("Tables créées avec succès");
});

db.close();
