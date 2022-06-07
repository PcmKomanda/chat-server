const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

const User = require("../../database/models/user");
const Session = require("../../database/models/session");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_REDIRECT_URL
    : process.env.DEV_GOOGLE_REDIRECT_URL
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

router.get("/", (req, res) => {
  const url = oauth2Client.generateAuthUrl({ scope: scopes });

  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  const {
    sub: id,
    name,
    picture,
    email,
  } = await axios
    .get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokens.access_token}`
    )
    .then((r) => r.data);

  // Try to find user in database.
  const user = await User.findOne({ google_id: id });
  if (user) {
    // Sign jwt token.
    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    // Create new session.
    await Session.create({
      user_id: user._id,
      tokenHash: token,
    });
    // Redirect to client.
    res.redirect(
      process.env.NODE_ENV == "production"
        ? process.env.PROD_CLIENT_URL + `?token=${token}`
        : process.env.DEV_CLIENT_URL + `?token=${token}`
    );
  } else {
    // Create new user.
    const user = await User.create({
      google_id: id,
      display_name: name,
      login_name: name.toLowerCase(),
      email,
      avatar:
        picture ||
        `https://avatars.dicebear.com/api/adventurer-neutral/${name}.png`,
    });
    // Sign jwt token.
    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    // Create new session.
    await Session.create({
      user_id: user._id,
      tokenHash: token,
    });

    // Redirect to client.
    res.redirect(
      process.env.NODE_ENV == "production"
        ? process.env.PROD_CLIENT_URL + `?token=${token}`
        : process.env.DEV_CLIENT_URL + `?token=${token}`
    );
  }
});

module.exports = router;
