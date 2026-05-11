const User = require("../models/User");
const Role = require("../models/Role");
const { hashPassword } = require("../utils/hash");
const {
  validatePassword,
  validateEmail,
  validateString,
} = require("../utils/validation");

const getPermissionsForRole = async (role) => {
  if (!role) return [];
  const roleDoc = await Role.findOne({ name: role });
  if (
    roleDoc &&
    Array.isArray(roleDoc.permissions) &&
    roleDoc.permissions.length > 0
  ) {
    return roleDoc.permissions;
  }
  return []; // No default permissions - role must exist in database
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      designation,
      employeeId,
      status,
      permissions,
    } = req.body;

    // Input validation
    const nameValidation = validateString(name, "Name", 2);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists" });
    }

    if (designation && designation.trim().length > 100) {
      return res
        .status(400)
        .json({ message: "Designation cannot exceed 100 characters" });
    }

    // Validate that role exists in database
    if (role) {
      const roleExists = await Role.findOne({ name: role });
      if (!roleExists) {
        return res
          .status(400)
          .json({ message: "Selected role does not exist" });
      }
    } else {
      return res.status(400).json({ message: "Role is required" });
    }

    const hashedPassword = await hashPassword(password);
    const rolePermissions = await getPermissionsForRole(role);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      designation: designation ? designation.trim() : "",
      employeeId: employeeId || "",
      status: status || "active",
      permissions:
        permissions && permissions.length > 0 ? permissions : rolePermissions,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: "Server error during user creation" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      designation,
      employeeId,
      status,
      permissions,
      password,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "A user with this email already exists" });
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) {
      // Validate that role exists in database
      const roleExists = await Role.findOne({ name: role });
      if (!roleExists) {
        return res
          .status(400)
          .json({ message: "Selected role does not exist" });
      }
      user.role = role;
      // Update permissions if not explicitly provided
      if (permissions === undefined) {
        user.permissions = await getPermissionsForRole(role);
      }
    }
    if (designation !== undefined) user.designation = designation;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (status !== undefined) user.status = status;
    if (permissions !== undefined) user.permissions = permissions;

    if (password && password.trim() !== "") {
      user.password = await hashPassword(password);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting super admin users
    if (user.role === "superadmin") {
      return res.status(403).json({
        message:
          "Cannot delete a super admin user. Promote to different role first.",
      });
    }

    // Prevent deleting own account
    if (req.user.id === req.params.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { roleId } = req.body;

    const user = await User.findById(req.params.id);
    const role = await Role.findById(roleId);

    if (!user || !role) {
      return res.status(404).json({ message: "User or Role not found" });
    }

    user.role = role.name;
    user.permissions = Array.isArray(role.permissions) ? role.permissions : [];
    await user.save();

    res.json({ message: "Role assigned successfully" });
  } catch (err) {
    console.error("Error assigning role:", err);
    res.status(500).json({ message: "Server error" });
  }
};
