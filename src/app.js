require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const vendasRoutes = require("./routes/vendas");
const relatoriosRoutes = require("./routes/relatorios");

const app = express();

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "..", "public")));

// Middlewares básicos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Rotas
app.use("/", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/vendas", vendasRoutes);
app.use("/relatorios", relatoriosRoutes);

// Rota raiz redireciona dependendo se está logado
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  return res.redirect("/login");
});

// 404
app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});

// Sobe o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});