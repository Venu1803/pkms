const mongoose = require("mongoose");

const keySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    keyType: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    environment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Environment",
      required: true,
    },
    data: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    isOverride: {
      type: Boolean,
      default: false,
    },
    overrideFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Key",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Key", keySchema);
