const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const auth = require("../Middleware/auth");
const checkPermission = require("../Middleware/checkPermission");

// Role management requires manageRoles permission

router.post("/", auth, checkPermission("manageRoles"), createRole);
router.get("/", auth, checkPermission("manageRoles"), getRoles);
router.put("/:id", auth, checkPermission("manageRoles"), updateRole);
router.delete("/:id", auth, checkPermission("manageRoles"), deleteRole);

module.exports = router;
