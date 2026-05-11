const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const auth = require("../Middleware/auth");
const { checkProjectAccess } = require("../Middleware/roleMiddleware");
const checkPermission = require("../Middleware/checkPermission");

router.post(
  "/",
  auth,
  checkPermission("createProjects"),
  projectController.addProject,
);
router.get("/", auth, projectController.getProjects);
router.get(
  "/:id",
  auth,
  checkProjectAccess("viewProjects"),
  projectController.getProject,
);
router.put(
  "/:id",
  auth,
  checkPermission("editProjects"),
  checkProjectAccess("editProjects"),
  projectController.updateProject,
);
router.delete(
  "/:id",
  auth,
  checkPermission("deleteProjects"),
  checkProjectAccess("deleteProjects"),
  projectController.deleteProject,
);

router.post(
  "/:id/members",
  auth,
  checkPermission("manageProjectMembers"),
  checkProjectAccess("editProjects"),
  projectController.assignMember,
);

router.delete(
  "/:id/members/:userId",
  auth,
  checkPermission("manageProjectMembers"),
  checkProjectAccess("editProjects"),
  projectController.removeMember,
);

router.patch(
  "/:id/members/:userId/modules",
  auth,
  checkPermission("manageProjectMembers"),
  checkProjectAccess("editProjects"),
  projectController.updateMemberModules,
);

module.exports = router;
