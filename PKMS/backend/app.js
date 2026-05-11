const express = require("express");
const cors = require("cors");
const errorHandler = require("./Middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const envRoutes = require("./routes/envRoutes");
const keyTypeRoutes = require("./routes/keyTypeRoutes");
const keyRoutes = require("./routes/keyRoutes");
const userRoutes = require("./routes/userRoutes");
const auditRoutes = require("./routes/auditRoutes");
const roleRoutes = require("./routes/roleRoutes");
const app = express();

// CORS configuration: restrict to frontend URL only
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Parsed Body:", req.body);
  }
  next();
});

app.get("/api/ping", (req, res) => res.send("pong"));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/environments", envRoutes);
app.use("/api/keyTypes", keyTypeRoutes);
app.use("/api/keys", keyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/roles", roleRoutes);

// Global error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
