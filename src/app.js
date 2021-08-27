const express = require("express");
const path = require("path");
const http = require("http");
const socket = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = process.env.PORT || 3000;

const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

app.get("", (req, res) => {
  res.send("index");
});

//socket.emit , io.emit , socket.broadcast.emit
//io.to().emit  , socket.broadcast.to().emit

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome !"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined !`)
      );

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (msgData, callback) => {
    const filter = new Filter();

    if (filter.isProfane(msgData)) {
      return callback("Profanity is not allowed");
    }

    const user = getUser(socket.id);

    io.to(user.room).emit("message", generateMessage(user.username, msgData));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left !`)
      );
    }
  });

  socket.on("sendLocation", (data, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${data.lat},${data.long}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
