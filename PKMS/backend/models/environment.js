const mongoose = require("mongoose");

const environmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    syncMetadata: [
      {
        moduleName: String,
        lastSyncedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Environment", environmentSchema);
