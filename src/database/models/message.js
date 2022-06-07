// Import mongoose.
const mongoose = require("mongoose");

// Select Schema constructor.
const { Schema } = mongoose;

// Create new Schema that will be used to store message data.
const MessageSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: { type: String, required: true },
    room: { type: Schema.Types.ObjectId, ref: "room" },
  },
  { timestamps: true, versionKey: false }
);

// Export model with name "message" and schema "messageSchema".
module.exports = mongoose.model("message", MessageSchema);
