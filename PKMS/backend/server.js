require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Validate required environment variables
const requiredEnvVars = [
  "MASTER_KEY",
  "JWT_SECRET",
  "MONGO_URI",
  "PORT",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`ERROR: ${envVar} must be set in .env`);
    process.exit(1);
  }
}

if (process.env.MASTER_KEY.length < 32) {
  console.error(
    "ERROR: MASTER_KEY must be at least 32 characters long.",
  );
  process.exit(1);
}

// Connect to MongoDB with error recovery
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Exiting application due to database connection failure.");
    process.exit(1);
  });

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
