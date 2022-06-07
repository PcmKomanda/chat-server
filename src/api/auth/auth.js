const express = require("express");
const router = express.Router();
const Session = require("../../database/models/session");
router.use("/discord", require("./discord"));
router.use("/google", require("./google"));
router.use("/local", require("./local"));
router.use("/forgot", require("./forgot"));

router.all("/", (req, res) => {
  res.send({
    message: "Authentication",
  });
});

router.post("/revoke", async (req, res) => {
  const { token } = req.query;

  await Session.findOneAndUpdate(
    { tokenHash: token },
    {
      valid: false,
    }
  );

  res.send({ message: "Token has been revoked!" });
});

router.get("/check", async (req, res) => {
  const { token } = req.query;

  const isValid = await Session.findOne({ tokenHash: token });
  res.send({ valid: isValid?.valid });
});

module.exports = router;
