const express = require("express");
const router = express.Router();

const {
  createOrderPaypal,
  captureOrderPaypal,
  getAccess,
} = require("../Controllers/paypal.js");
const verificarToken = require("../middleware/verificarToken.js");

router.get("/", getAccess);
router.post("/create-order", verificarToken, createOrderPaypal);
router.post("/capture-order/:orderId", verificarToken, captureOrderPaypal);

module.exports = router;
