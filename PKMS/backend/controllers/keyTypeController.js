const KeyType = require("../models/keyType");
const Key = require("../models/keys");

exports.getKeyTypes = async (req, res) => {
  try {
    const { projectId } = req.query;
    const Project = require("../models/projects");

    // If projectId is provided, filter key types based on user's assigned modules
    if (projectId) {
      const project =
        await Project.findById(projectId).populate("members.user");
      const isAdmin = ["superadmin", "admin", "devops"].includes(req.user.role);
      const isCreator = project && project.createdBy.toString() === req.user.id;
      const member =
        project &&
        project.members.find(
          (m) => m.user && m.user._id.toString() === req.user.id,
        );

      // If user is not admin/creator and has no assigned modules, return empty array
      if (!isAdmin && !isCreator && member) {
        const hasExplicitAssignments = member.assignedModules?.length > 0;

        if (!hasExplicitAssignments) {
          return res.json([]);
        }

        // Return only the assigned modules (as KeyTypes)
        const types = await KeyType.find({
          slug: { $in: member.assignedModules },
        }).sort({ name: 1 });
        return res.json(types);
      }
    }

    // All other cases: return all key types
    const types = await KeyType.find().sort({ name: 1 });
    res.json(types);
  } catch (error) {
    console.error("Error fetching key types:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addKeyType = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const newType = await KeyType.create({ name, slug });
    res.status(201).json(newType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Module name must be unique" });
    }
    console.error("Error creating key type:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.renameKeyType = async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ message: "New module name is required" });
    }

    const updatedType = await KeyType.findOneAndUpdate(
      { name: oldName },
      { name: newName, slug: newName.toLowerCase().replace(/\s+/g, "-") },
      { new: true },
    );

    const result = await Key.updateMany(
      { keyType: oldName },
      { keyType: newName },
    );

    res.json({
      message: "Module renamed successfully",
      updatedType,
      modifiedKeysCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error renaming module:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteKeyType = async (req, res) => {
  try {
    const { name } = req.params;

    const keyCount = await Key.countDocuments({ keyType: name });
    if (keyCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete module that contains keys. Please delete all keys first.",
      });
    }

    const deletedType = await KeyType.findOneAndDelete({ name });
    if (!deletedType) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json({
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ message: "Server error" });
  }
};
