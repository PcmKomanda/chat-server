// Imports.
const express = require("express");

// Create router.
const router = express.Router();

// Routers.
router.use("/auth", require("./auth/auth"));
router.use("/avatars", require("./avatars"));
router.use("/users", require("./users"));

router.get("/", (req, res) => {
  res.send({
    name: "MGP Project „Tinklapis. Bendravimui.“",
    health: res.statusCode,
    version: "v1.0",
  });
});

// Export router.
module.exports = router;
