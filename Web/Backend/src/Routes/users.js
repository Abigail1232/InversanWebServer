const express = require("express");
const router = express.Router();
const usersController = require("../Controllers/users");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Rutas que solo requieren estar autenticado (cada usuario gestiona lo suyo)
router.put("/branch/:id", verificarToken, usersController.changeUserBranch);
router.get("/me", verificarToken, usersController.getMe);
router.patch("/me", verificarToken, usersController.updateMe);
router.get("/privileges", verificarToken, usersController.ListarPrivilegiosMe);
router.patch(
  "/me/change-password",
  verificarToken,
  usersController.changeMyPassword
);

// Listar usuarios — solo quien tenga ADM_USUARIOS
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.getAllUsers
);

// Obtener repartidores disponibles — accesible para gestores de pedidos
router.get(
  "/repartidores",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_PEDIDOS, PRIVILEGIOS.ALL_ACCESS),
  usersController.getRepartidores
);

// Crear usuario — requiere ADM_USUARIOS
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.createUser
);

// Activar / Desactivar / Cambiar rol / Cambiar contraseña — requiere ADM_USUARIOS
router.put(
  "/desactivate/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.desactivarUsuario
);
router.put(
  "/activate/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.ActivarUsuario
);
router.put(
  "/change-role/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.changeRolUser
);
router.put(
  "/change-password/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.changePassword
);

// Listar privilegios de un usuario — requiere ADM_USUARIOS
router.get(
  "/privileges/:usuario",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.ListarPrivilegiosUsuario
);

// Ver y actualizar usuario por ID
router.get(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.getUserById
);
router.patch(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_USUARIOS),
  usersController.updateUser
);

module.exports = router;
