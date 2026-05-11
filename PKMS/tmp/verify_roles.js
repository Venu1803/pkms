const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const User = require("../backend/models/User");

const verify = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/secretvault";
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const rolesToTest = ["devops", "developer", "tester", "user"];
    const testUsers = [];

    const getDefaultPermissions = (role) => {
      switch (role) {
        case "superadmin":
        case "admin":
        case "devops":
          return ["viewKeys", "editKeys", "deleteKeys", "createKeys"];
        case "developer":
          return ["viewKeys", "editKeys", "createKeys"];
        case "tester":
        case "user":
        default:
          return ["viewKeys"];
      }
    };

    for (const role of rolesToTest) {
      console.log(`\nTesting role: ${role}`);
      const userData = {
        name: `Test ${role}`,
        email: `test_${role}_${Date.now()}@example.com`,
        password: "password123",
        role: role,
        designation: "Tester",
        employeeId: `EMP_${role}`,
        permissions: getDefaultPermissions(role),
      };

      const user = new User(userData);
      await user.save();
      console.log(` User saved for ${role}:`, user.permissions);
      testUsers.push(user._id);
    }

    // Cleanup
    console.log("\nCleaning up test users...");
    await User.deleteMany({ _id: { $in: testUsers } });
    console.log("Cleanup complete");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
};

verify();
