const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["developer", "devops", "tester"],
        required: true,
      },
      permissions: {
        type: [String],
        enum: ["viewProjects", "editProjects", "deleteProjects", "viewKeys", "createKeys", "editKeys", "deleteKeys"],
        default: ["viewProjects", "viewKeys"],
      },
      assignedModules: {
        type: [String],
        default: [],
      },
      assignedEnvironments: {
        type: [String],
        default: [],
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
