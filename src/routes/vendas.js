const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/authMiddleware");
const vendasController = require("../controllers/vendasController");

// /vendas/curva-abc
router.get("/curva-abc", authRequired, vendasController.getCurvaABC);

module.exports = router;