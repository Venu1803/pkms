const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword } = require("../utils/hash");
const {
  validatePassword,
  validateEmail,
  validateString,
} = require("../utils/validation");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, designation, employeeId } = req.body;

    // Input validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    const nameValidation = validateString(name, "Name", 2);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      designation,
      employeeId,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId,
        designation: newUser.designation,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    // Case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await verifyPassword(user.password, password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // BUG FIX: Include user.permissions in the JWT payload so that
    // roleMiddleware.checkProjectAccess can evaluate global permission grants
    // for developer/tester roles (step 4). Without this, user.permissions in
    // req.user was always undefined, silently breaking that access path.
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        permissions: user.permissions || [],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
