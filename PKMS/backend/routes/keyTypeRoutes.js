const express = require("express");
const router = express.Router();
const keyTypeController = require("../controllers/keyTypeController");
const auth = require("../Middleware/auth");
const { authorize } = require("../Middleware/roleMiddleware");

router.get("/", auth, keyTypeController.getKeyTypes);
router.post(
  "/",
  auth,
  authorize("superadmin", "admin", "devops"),
  keyTypeController.addKeyType,
);
router.put(
  "/rename/:oldName",
  auth,
  authorize("superadmin", "admin", "devops"),
  keyTypeController.renameKeyType,
);
router.delete(
  "/:name",
  auth,
  authorize("superadmin", "admin", "devops"),
  keyTypeController.deleteKeyType,
);

module.exports = router;
