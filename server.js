const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const {
  connectToDB,
  getUserByName,
  getUserByEmail,
} = require("./src/dataBaseController");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT || 4000;

connectToDB();

io.use(async (socket, next) => {
  const token = socket.handshake.headers["authorization"];
  if (token === "abc") {
    return next();
  }
  if (token === "login") {
    const acc = socket.handshake.headers["user"];
    const pass = socket.handshake.headers["password"];
    let data;
    if (acc.includes("@") && user.includes(".")) {
      data = await getUserByEmail(acc);
    } else {
      data = await getUserByName(acc);
    }
    if (!data[0]) return next(new Error("User not found"));
    if (data[0].password !== pass) {
      return next(new Error("Wrong password"));
    }
  }
  next();
});

io.on("connection", async (socket) => {
  console.log("connect");
  socket.emit("hello");
});

io.listen(PORT, () => console.log(`Server running on port ${PORT}`));
