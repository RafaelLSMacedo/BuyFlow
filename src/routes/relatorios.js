const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/authMiddleware");
const relatoriosController = require("../controllers/relatoriosController");

// /relatorios
router.get("/", authRequired, relatoriosController.getRelatorios);

module.exports = router;