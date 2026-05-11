const User = require("../models/User");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate("role");

      if (!user) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userRoleName = (user.role || "").toString().toLowerCase();
      if (["superadmin", "admin", "devops"].includes(userRoleName)) {
        return next();
      }

      // Check if user has the required permission directly
      const userPermissions = Array.isArray(user.permissions)
        ? user.permissions
        : [];

      if (userPermissions.includes(requiredPermission)) {
        return next();
      }

      // Check if user's role has the required permission
      const rolePermissions =
        user.role && Array.isArray(user.role.permissions)
          ? user.role.permissions
          : [];

      if (rolePermissions.includes(requiredPermission)) {
        return next();
      }

      // Check if user has admin-level access (roles that can manage users/roles)
      // This is determined by roles that have user management permissions
      const adminPermissions = [
        "createUsers",
        "editUsers",
        "deleteUsers",
        "manageRoles",
      ];
      const hasAdminAccess = adminPermissions.some(
        (perm) =>
          userPermissions.includes(perm) || rolePermissions.includes(perm),
      );

      if (hasAdminAccess) {
        return next();
      }

      return res.status(403).json({
        message: `Permission denied: ${requiredPermission} required`,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Server error during permission check" });
    }
  };
};

module.exports = checkPermission;
