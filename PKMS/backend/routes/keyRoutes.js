const express = require("express");
const router = express.Router();
const keyController = require("../controllers/keyController");
const auth = require("../Middleware/auth");
const { checkProjectAccess } = require("../Middleware/roleMiddleware");

router.get("/", auth, checkProjectAccess("viewKeys"), keyController.getKeys);
router.post("/", auth, checkProjectAccess("createKeys"), keyController.addKey);
router.put(
  "/:keyId",
  auth,
  checkProjectAccess("editKeys"),
  keyController.updateKey,
);
router.get("/:slug", auth, checkProjectAccess("viewKeys"), keyController.getKeys);
router.delete(
  "/:keyId/override",
  auth,
  checkProjectAccess("deleteKeys"),
  keyController.resetOverride,
);
router.post(
  "/bulk-sync",
  auth,
  checkProjectAccess("createKeys"),
  keyController.bulkSyncKeys,
);
router.post(
  "/bulk-upsert",
  auth,
  checkProjectAccess("createKeys"),
  keyController.bulkUpsertKeys,
);
router.delete(
  "/:keyId",
  auth,
  checkProjectAccess("deleteKeys"),
  keyController.deleteKey,
);

module.exports = router;
