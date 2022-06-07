// Imports.
const express = require("express");
const request = require("request");

// Create router.
const router = express.Router();
//! avatars.dicebear.com/api/adventurer-neutral/${username}.png

// Route that will be used to get user avatar.
router.get("/:avatar", async (req, res) => {
  const { avatar } = req.params;

  const url = `https://avatars.dicebear.com/api/adventurer-neutral/${avatar}`;

  // Send avatar jpg to client.
  request(
    {
      url: url,
      encoding: null,
    },
    (err, resp, buffer) => {
      if (!err && resp.statusCode === 200) {
        res.set("Content-Type", "image/jpeg");
        res.send(resp.body);
      }
    }
  );
});

// Export router.
module.exports = router;
