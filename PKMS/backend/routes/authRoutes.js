const express = require("express");
const router = express.Router();
const { login, register, getUsers } = require("../controllers/authController");
const auth = require("../Middleware/auth");

router.post("/register", register);
router.post("/login", login); 
// Secure endpoint: require authentication
router.get("/users", auth, getUsers);

module.exports = router;
