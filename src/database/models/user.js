// Import mongoose.
const mongoose = require("mongoose");

// Select Schema constructor.
const { Schema } = mongoose;

// Create new Schema that will be used to store user data.
const userSchema = new Schema(
  {
    display_name: {
      type: String,
      required: true,
    },
    login_name: {
      type: String,
      required: true,
    },
    discord_id: {
      type: String,
    },
    google_id: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    otp: { type: String },
    password: { type: String },
    avatar: {
      type: String,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    mod: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Export mongoose model with name "user" and schema "userSchema".
module.exports = mongoose.model("user", userSchema);
