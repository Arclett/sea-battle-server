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
  updateUser,
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
  console.log(token, "token");
  if (token === "guest") {
    socket.data = { name: "guest" };
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
    console.log(email);
    console.log(emailCheck);
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
  //authorized users

  if (socket.data.name !== "guest") {
    const token = jwt.sign({ name: socket.data.name }, secret);
    console.log(token);
    console.log(socket.data);
    console.log("connect");
    const userData = {
      name: socket.data.name,
      exp: socket.data.exp,
      gold: socket.data.gold,
      currentShipSkin: socket.data.currentShipSkin,
      currentFieldSkin: socket.data.currentFieldSkin,
      obtShipSkins: socket.data.obtShipSkins,
      obtFieldSkins: socket.data.obtFieldSkins,
      winsPvP: socket.data.winsPvP,
      winsPvE: socket.data.winsPvE,
    };
    console.log(userData);
    socket.emit("auth token", token, userData);
    socket.join("main-room");
    // console.log(io.sockets.sockets);
    socket.on("send to chat", (text) => {
      io.to("main-room").emit("chat message", `${socket.data.name}: ${text}`);
    });

    //random matchmaking

    socket.on("find random", () => {
      socket.leave("main-room");
      const rooms = io.of("/").adapter.rooms;
      const findRooms = rooms.get("find-room");
      if (!findRooms) {
        socket.join("find-room");
      } else {
        const opp = Array.from(findRooms)[0];
        socket.to(opp).emit("start battle", socket.id);
        io.to(socket.id).emit("start battle", opp);
      }

      //find opponent by name
    });

    socket.on("join by link", (user) => {
      // io.to(user).leave("main-room");
      socket.to(user).emit("start battle", socket.id);
      io.to(socket.id).emit("start battle", user);
    });

    socket.on("cancel", () => {
      socket.join("main-room");
      socket.leave("find-room");
      socket.leave("test-room");
    });

    // socket.on("send link", () => {
    //   socket.leave("main-room");
    // });

    socket.on("update user", async (data) => {
      await updateUser(data.name, data);
      socket.emit("update complete");
    });
  }
  if (socket.data.name === "guest") {
    console.log("guest connect!");
    socket.on("join by link", (user) => {
      // io.to(user).leave("main-room");
      socket.to(user).emit("start battle", socket.id);
      io.to(socket.id).emit("start battle", user);
    });
  }

  socket.on("ship placement complete", (opp, shipsData) => {
    socket.to(opp).emit("placement ready", shipsData);
  });

  socket.on("placement over", (opp, shipsData) => {
    const flip = Math.round(Math.random() * 10);
    if (flip > 5) {
      socket.emit("start game", "first");
      socket.to(opp).emit("start game", "second", shipsData);
    } else {
      socket.emit("start game", "second");
      socket.to(opp).emit("start game", "first", shipsData);
    }
  });
  socket.on("enemy turn", (opp, matrix, shipsData) => {
    socket.to(opp).emit("my turn", matrix, shipsData);
  });
});

io.listen(PORT, () => console.log(`Server running on port ${PORT}`));
