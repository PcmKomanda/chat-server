// Imports.
const express = require("express");

// Create router.
const router = express.Router();

// Models.
const User = require("../database/models/user");

// Route that will be used to promote or demote a user.
router.post("/:id/:status", async (req, res) => {
  const { id, status } = req.params;
  const user = await User.findOneAndUpdate(
    {
      _id: id,
    },
    { mod: status === "promote" ? true : false }
  );
  // Send success message to client.
  res.send({ message: `User ${user.login_name} has been ${status}d` });
});

// Export router.
module.exports = router;
