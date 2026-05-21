const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const relatoriosController = require("../controllers/relatoriosController");

// Todas as rotas de relatórios exigem login
router.use(authMiddleware.authRequired);

// Página de relatórios
router.get("/", relatoriosController.getRelatorios);

module.exports = router;