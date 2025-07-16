require("./models/createTables");

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

// 🔐 CORS avec origine dynamique
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 📦 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 🔐 Configuration session
app.use(
  session({
    secret: "super-secret", // Change en production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true si HTTPS
  })
);

// 🛣️ Routes
app.use("/api/visites", require("./routes/visites"));
app.use("/api/visiteurs", require("./routes/visiteurs"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/employes", require("./routes/employes"));
app.use("/api/formations", require("./routes/formations"));
app.use("/api/login", require("./routes/login"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
