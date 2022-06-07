// Imports.
const express = require("express");
const jwt = require("jsonwebtoken");
const DiscordOauth2 = require("discord-oauth2");

// Create router.
const router = express.Router();

// Set discord redirect url.
let discord_auth;
if (process.env.NODE_ENV !== "production") {
  discord_auth = process.env.DISCORD_DEV_OAUTH_URL;
} else {
  discord_auth = process.env.DISCORD_PROD_OAUTH_URL;
}

// Models.
const User = require("../../database/models/user");
const Session = require("../../database/models/session");

// Create new discord oauth instance.
const oauth = new DiscordOauth2({
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri:
    process.env.NODE_ENV !== "production"
      ? process.env.DISCORD_DEV_REDIRECT_URL
      : process.env.DISCORD_PROD_REDIRECT_URL,
});

// Default route.
router.get("/", (req, res) => {
  res.redirect(discord_auth);
});

// Callback route for discord.
router.get("/callback", async (req, res) => {
  try {
    // Set constant for code.
    const { code } = req.query;

    // Discord oauth2.
    oauth
      .tokenRequest({
        grantType: "authorization_code",
        scope: "identify email",
        code,
      })
      .then(async (r) => {
        // Get required discord user information.
        const { id, username, email, avatar } = await oauth.getUser(
          r.access_token
        );
        // Try to find user in database.
        const user = await User.findOne({ discord_id: id });

        if (user) {
          // Sign jwt token.
          const token = await jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            {
              expiresIn: "24h",
            }
          );
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
            discord_id: id,
            display_name: username,
            login_name: username.toLowerCase(),
            email,
            avatar: avatar
              ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
              : `https://avatars.dicebear.com/api/adventurer-neutral/${username}.png`,
          });
          // Sign jwt token.
          const token = await jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            {
              expiresIn: "24h",
            }
          );
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
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
    res.status(error.response ? error.response.status : 400).send({
      status: error.response ? error.response.status : 400,
      error: error,
    });
  }
});

// Export router.
module.exports = router;
