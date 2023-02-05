const express = require("express");
const { promisify } = require("util");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const {
  connectToDB,
  getUserByName,
  getUserByEmail,
  addUser,
} = require("./src/dataBaseController");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT || 4000;

connectToDB();

const secret = "secret-key";

//authorization middleware

io.use(async (socket, next) => {
  const token = socket.handshake.headers["authorization"];
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
    socket.data = data[0];
    return next();
  }
  if (token === "reg") {
    const acc = socket.handshake.headers["user"];
    const pass = socket.handshake.headers["password"];
    const email = socket.handshake.headers["email"];

    const userCheck = await getUserByName(acc);
    if (userCheck[0])
      return next(new Error("User with this Name already exist!"));
    const emailCheck = await getUserByEmail(email);
    if (emailCheck[0])
      return next(new Error("User with this Email already exist!"));
    const data = { body: { name: acc, password: pass, eMail: email } };
    const userData = await addUser(data);
    socket.data = userData;
    return next();
  }
  try {
    const decoded = await promisify(jwt.verify)(token, secret);
    const data = await getUserByName(decoded.name);
    socket.data = data[0];
    return next();
  } catch (err) {
    return next(new Error("Authorization Failed!"));
  }
});

//socket events

io.on("connection", async (socket) => {
  const token = jwt.sign({ name: socket.data.name }, secret);
  console.log(token);
  console.log(socket.data);
  console.log("connect");
  const userData = {
    userName: socket.data.name,
    userGold: socket.data.gold,
    currentFrame: socket.data.currentFrame,
    currentShipSkin: socket.data.currentShipSkin,
    currentFieldSkin: socket.data.currentFieldSkin,
  };
  socket.emit("auth token", token, userData);
});

io.listen(PORT, () => console.log(`Server running on port ${PORT}`));
