const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { authorize, checkProjectAccess } = require("../Middleware/roleMiddleware");
const {
  getProjectLogs,
  getKeyLogs,
  getRecentLogs,
} = require("../controllers/auditController");

router.use(auth);

router.get("/recent", authorize("superadmin", "admin"), getRecentLogs);
router.get(
  "/project/:projectId",
  checkProjectAccess("viewKeys"),
  getProjectLogs,
);
router.get("/key/:keyId", checkProjectAccess("viewKeys"), getKeyLogs);

module.exports = router;
