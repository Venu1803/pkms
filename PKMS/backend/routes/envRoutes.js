const express = require("express");
const router = express.Router();
const envController = require("../controllers/envController");
const auth = require("../Middleware/auth");
const { checkProjectAccess } = require("../Middleware/roleMiddleware");

router.get(
  "/",
  auth,
  checkProjectAccess("viewKeys"),
  envController.getEnvironments,
);
router.post(
  "/",
  auth,
  checkProjectAccess("createKeys"),
  envController.addEnvironment,
);
router.put(
  "/:id",
  auth,
  checkProjectAccess("editKeys"),
  envController.updateEnvironment,
);
router.delete(
  "/:id",
  auth,
  checkProjectAccess("deleteKeys"),
  envController.deleteEnvironment,
);

module.exports = router;
