const express = require("express");
const router = express.Router();
const verificarTokenOpcional = require("../middleware/verificarTokenOpcional");
const controllerCart = require("../Controllers/cart")

// Añadir producto/stock al carrito
router.post("/", verificarTokenOpcional, controllerCart.addToCart);
// Incrementar carrito
router.post("/increment", verificarTokenOpcional, controllerCart.modifyCart)
// Decrementar carrito
router.post("/decrement", verificarTokenOpcional, controllerCart.decrementProduct);
// Conseguir el carrito
router.get("/", verificarTokenOpcional, controllerCart.getCart);
// Eliminar del carrito id_producto
router.delete("/product/:id", verificarTokenOpcional, controllerCart.deleteProduct);
// Eliminar carrito
router.delete("/", verificarTokenOpcional, controllerCart.deleteCart);
// Sincronizar JWT carritos con la BD Post-Login
router.post("/sync", verificarTokenOpcional, controllerCart.syncCarts);

module.exports = router;