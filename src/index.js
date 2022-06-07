// Imports.
require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./database/db");
const path = require("path");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

// Create app.
const app = express();
const httpServer = createServer(app);

// Models.
const User = require("./database/models/user");
const Message = require("./database/models/message");
const Session = require("./database/models/session");

// Events.
const MessageEventEmitter = Message.watch();

MessageEventEmitter.setMaxListeners(0);

app.use(
  cors({
    origin: "*",
    withCredentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
// Express routes.
app.use("/api", require("./api/api"));
app.use("/", express.static(path.join(__dirname, "/web")));

// Create socket.io server.
var io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://chatmgp.loca.lt"
        : "http://localhost:3000",
    credentials: true,
  },
  allowEIO3: true,
});

// Count of online users.
const connections = new Set();

io.on("connection", async (s) => {
  // Token constant.
  let token;
  // socket.io auth event.
  s.on("auth", async (data) => {
    try {
      token = JSON.parse(data);
      // Find session by token.
      const session = await Session.findOne({ tokenHash: token });

      // If session is not found return nothing.
      if (!session.valid) {
        console.log("Invalid token: " + token);
        return;
      }
      // Verify if token is with correct secret and if id exists.
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      if (!id) return;

      // if token is correct find user by id and if not found return nothing.
      let user = await User.findOne({ _id: id });
      if (!user) return;
      // Send user info to client.
      s.emit("auth", JSON.stringify(user));

      // Add new user to online users and send count to client.
      connections.add(s);
      s.emit("online", { online: connections.size });

      // Wait for getMessages event and send messages to client.
      s.on("getMessages", async (data) => {
        let messages = await Message.find().populate("author");
        s.emit("messages", messages);
      });

      // Wait for deleteMessage event and delete specific message.
      s.on("deleteMessage", async (data) => {
        // Find message and delete by _id.
        await Message.findOneAndDelete({ _id: data });

        console.log(`Message ${data} deleted.`);
      });

      // Watch for new messages.
      MessageEventEmitter.on("change", async (data) => {
        // Get new messages, populate author and send them to client.
        const messages = await Message.find().populate("author");
        s.emit("messages", messages);
      });

      s.on("update_user", async (data) => {
        console.log(data);
        const user = await User.findOne({ _id: data.id });
        s.emit("auth", JSON.stringify(user));
      });

      // Wait for send_message event and save new message.
      s.on("send_message", async (data) => {
        // Find User.
        const user = await User.findOne({ _id: data.author._id });

        // Create new message.
        await Message.create({
          author: user,
          content: data.content,
        });
      });

      // Wait for update_messages_for_everyone event and update messages for everyone.
      s.on("update_messages_for_everyone", async (data) => {
        // Find user and populate author.
        const messages = await Message.find().populate("author");

        // Send messages to everyone.
        s.broadcast.emit("messages", messages);
        s.emit("messages", messages);
      });
    } catch (err) {
      console.log(`${s.id} failed to login`);
      console.log(err.message);
    }
  });
  // Send count of online users to client.
  s.emit("online", { online: connections.size });
  s.broadcast.emit("online", { online: connections.size });

  // Update count of online users on disconnect.
  s.once("disconnect", () => {
    connections.delete(s);
    s.broadcast.emit("online", { online: connections.size });
  });
});

// Start server after creating connection to database.
db.once("open", () => {
  httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on *:${process.env.PORT || 3000}`);
  });
  console.log("Connected to DB!");
});
