const AuditLog = require("../models/AuditLog");

exports.getProjectLogs = async (req, res) => {
  try {
    const projectId = req.project._id;
    const logs = await AuditLog.find({ projectId })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching project logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getKeyLogs = async (req, res) => {
  try {
    const { keyId } = req.params;
    const logs = await AuditLog.find({ targetId: keyId })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching key logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRecentLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "name email")
      .populate("projectId", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};
