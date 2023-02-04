const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

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

const authToken = "abs"; //this will be replaced with jwt later...may be...

//authorization middleware

io.use(async (socket, next) => {
  const token = socket.handshake.headers["authorization"];
  if (token === authToken) {
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
    socket.data = data[0];
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
  }
  next();
});

//socket events

io.on("connection", async (socket) => {
  console.log(socket.data);
  console.log("connect");
  socket.emit("auth token", authToken, socket.data);
});

io.listen(PORT, () => console.log(`Server running on port ${PORT}`));
