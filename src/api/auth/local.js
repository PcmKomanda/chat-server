// Imports.
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create router.
const router = express.Router();

// Models.
const User = require("../../database/models/user.js");
const Session = require("../../database/models/session.js");

// Default route.
router.get("/", (req, res) => {
  res.send({ message: "Local Auth" });
});

// Register route.
router.post("/register", async (req, res) => {
  // Set constants for username, email and password.
  const { username, email, password } = req.body;

  // Check name and email.
  const checkName = await User.findOne({
    login_name: username.toLowerCase(),
  });
  const checkEmail = await User.findOne({
    email: email.toLowerCase(),
  });
  if (checkName) {
    res.send({ message: "Slapyvardis jau naudojamas." });
    return;
  }
  if (checkEmail) {
    res.send({ message: "El. Paštas jau naudojamas." });
    return;
  }

  // Check if password length is at least 5 characters.
  if (password.length < 6) res.send({ message: "Slaptažodis per trumpas." });

  // Hash password.
  const salt = await bcrypt.genSalt(5);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user.
  const user = await User.create({
    display_name: username,
    login_name: username.toLowerCase(),
    email,
    password: hashedPassword,
    avatar: `https://avatars.dicebear.com/api/adventurer-neutral/${username}.png`,
  });

  // Create token.
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "168h",
  });

  await Session.create({
    user_id: user._id,
    tokenHash: token,
  });

  res.send({ token });
});

// Login route.
router.post("/login", async (req, res) => {
  // Set constants for login_name and password.
  const { login_name, password } = req.body;
  // Find user by login_name and if user not found return error message.
  const user = await User.findOne({ login_name: login_name });
  if (!user) {
    res.send({ error: "Slapyvardis arba slaptažodis netinka." });
    return;
  }
  // Check if password is correct adnd if password is incorrect return error message.
  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    res.send({ error: "Slapyvardis arba slaptažodis netinka." });
    return;
  }

  // Create token.
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "168h",
  });

  await Session.create({
    user_id: user._id,
    tokenHash: token,
  });

  res.send({ token });
});

// Export router.
module.exports = router;
