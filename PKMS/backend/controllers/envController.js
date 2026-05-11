const Environment = require("../models/environment");

exports.getEnvironments = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};
    const environments = await Environment.find(filter).sort({ name: 1 });
    res.json(environments);
  } catch (error) {
    console.error("Error fetching environments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addEnvironment = async (req, res) => {
  try {
    const { name, projectId } = req.body;
    const newEnvironment = await Environment.create({ name, projectId });
    res.status(201).json(newEnvironment);
  } catch (error) {
    console.error("Error adding environment:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.updateEnvironment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedEnvironment = await Environment.findByIdAndUpdate(
      id,
      { name },
      { new: true },
    );
    if (!updatedEnvironment) {
      return res.status(404).json({ message: "Environment not found" });
    }
    res.json(updatedEnvironment);
  } catch (error) {
    console.error("Error updating environment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEnvironment = async (req, res) => {
  try {
    const { id } = req.params;

    const Key = require("../models/keys");
    const keyCount = await Key.countDocuments({ environment: id });
    if (keyCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete environment that contains keys. Please delete all keys first.",
      });
    }

    const deletedEnvironment = await Environment.findByIdAndDelete(id);
    if (!deletedEnvironment) {
      return res.status(404).json({ message: "Environment not found" });
    }
    res.json({ message: "Environment deleted successfully" });
  } catch (error) {
    console.error("Error deleting environment:", error);
    res.status(500).json({ message: "Server error" });
  }
};
