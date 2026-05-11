const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    permissions: [
      {
        type: String,
      },
    ],
    isProtected: {
      type: Boolean,
      default: false, // for SuperAdmin
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Role", roleSchema);
