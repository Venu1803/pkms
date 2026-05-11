const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "SYNC", "BULK_UPSERT"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Key",
    },
    targetName: {
      type: String,
    },
    oldValue: {
      type: String,
    },
    newValue: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
