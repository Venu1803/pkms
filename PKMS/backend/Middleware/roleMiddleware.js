const Project = require("../models/projects");
const Key = require("../models/keys");
const Environment = require("../models/environment");
const Role = require("../models/Role");

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    const userRoleName = req.user.role;

    if (!roles.includes(userRoleName)) {
      return res.status(403).json({
        message: `Role ${userRoleName} is not authorized to access this route`,
      });
    }
    next();
  };
};

exports.checkProjectAccess = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      let projectId =
        req.body.projectId ||
        req.query.projectId ||
        req.params.projectId ||
        req.params.id;

      const resourceId = req.params.id || req.params.keyId;

      // If we don't have a direct projectId, try to resolve it from the resourceId
      if (!projectId && resourceId) {
        const projectAsResource = await Project.findById(resourceId);
        if (projectAsResource) {
          projectId = resourceId;
        } else {
          const key = await Key.findById(resourceId);
          if (key) {
            projectId = key.projectId;
          } else {
            const env = await Environment.findById(resourceId);
            if (env) {
              projectId = env.projectId;
            }
          }
        }
      }

      // If still no projectId, allow request to proceed for endpoints that don't need it
      if (!projectId) {
        return next();
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const user = req.user;
      let isAuthorized = false;

      // 0. Check if user is admin/superadmin/devops (has full access to all projects)
      if (
        user.role &&
        ["superadmin", "admin", "devops"].includes(user.role.toLowerCase())
      ) {
        isAuthorized = true;
      }

      // 1. Check if user has admin-level permissions (can manage all projects)
      const adminPermissions = [
        "manageProjects",
        "viewAllProjects",
        "editAllProjects",
      ];
      const hasAdminAccess = adminPermissions.some(
        (perm) => user.permissions && user.permissions.includes(perm),
      );

      if (hasAdminAccess) {
        isAuthorized = true;
      }

      // 2. Project Creator check
      if (
        !isAuthorized &&
        project.createdBy &&
        (project.createdBy.toString() === user.id?.toString() ||
          project.createdBy.toString() === user.id)
      ) {
        isAuthorized = true;
      }

      // 3. Project Member check
      const member = project.members.find(
        (m) => m.user && m.user.toString() === user.id,
      );

      if (member) {
        // Being a member of a project always grants viewProjects access
        if (!requiredPermission || requiredPermission === "viewProjects") {
          isAuthorized = true;
        } else {
          const memberPermissions = Array.isArray(member.permissions)
            ? member.permissions
            : ["viewProjects", "viewKeys"]; // Default permissions for members

          if (memberPermissions.includes(requiredPermission)) {
            isAuthorized = true;
          }
        }
      }

      // 4. Global Permission check (for developers/testers with explicit permissions in JWT)
      if (
        !isAuthorized &&
        requiredPermission &&
        user.permissions &&
        user.permissions.includes(requiredPermission)
      ) {
        if (["developer", "tester"].includes(user.role)) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        console.error(
          `Access Denied: User ${user.id} (role: ${user.role}) tried to access project ${projectId}`,
        );
        console.error(
          `  - Is Admin: ${["superadmin", "admin", "devops"].includes(user.role?.toLowerCase())}`,
        );
        console.error(
          `  - Is Creator: ${project.createdBy?.toString() === user.id?.toString()}`,
        );
        console.error(`  - Is Member: ${!!member}`);
        console.error(`  - Required Permission: ${requiredPermission}`);
        return res
          .status(403)
          .json({ message: "Access Denied to this project or operation" });
      }

      req.project = project;
      next();
    } catch (error) {
      console.error("Error checking project access:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};
