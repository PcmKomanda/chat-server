// Import mongoose.
const mongoose = require("mongoose");

// Select Schema constructor.
const { Schema } = mongoose;

// Create new schema that will be used to store session data.
const SessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user" },
    tokenHash: String,
    valid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, skipVersioning: true }
);

// Export mongoose model with name "session" and schema "sessionSchema".
module.exports = mongoose.model("session", SessionSchema);
