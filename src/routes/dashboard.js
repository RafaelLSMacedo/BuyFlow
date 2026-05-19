const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authRequired } = require("../middlewares/authMiddleware");

router.get("/", authRequired, dashboardController.getDashboard);

module.exports = router;