const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const checkPermission = require("../Middleware/checkPermission");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
} = require("../controllers/userController");

router.use(auth);
router.use(checkPermission("manageUsers"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/role", checkPermission("assignRoles"), assignRole);

module.exports = router;
