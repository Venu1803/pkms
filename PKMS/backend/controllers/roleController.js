const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = new Role({ name, description, permissions });
    await role.save();

    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "A role with this name already exists." });
    }
    console.error("Error creating role:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isProtected) {
      return res
        .status(403)
        .json({ message: "Protected role cannot be modified" });
    }

    role.name = req.body.name || role.name;
    role.description = req.body.description || role.description;
    role.permissions = req.body.permissions || role.permissions;

    await role.save();

    res.json(role);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "A role with this name already exists." });
    }
    console.error("Error updating role:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isProtected) {
      return res
        .status(403)
        .json({ message: "Protected role cannot be deleted" });
    }

    await role.deleteOne();

    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
