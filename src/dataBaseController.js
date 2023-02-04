const mongoose = require("mongoose");

const pass = "qwert123";
const db = `mongodb+srv://admin:${pass}@cluster0.1w3zm6d.mongodb.net/sea-battle-db?retryWrites=true&w=majority`;

const connectToDB = () =>
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then((con) => {
      console.log("DB connect");
    });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  eMail: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  gold: {
    type: Number,
  },
});

const User = mongoose.model("User", userSchema);

const addUser = async (req) => {
  try {
    console.log("creating func");
    await User.create(req.body);
  } catch (err) {
    console.log(err);
  }
};

// addUser({
//   body: {
//     name: "Vitya",
//     gold: 200,
//   },
// });

const getAllUsers = async (res) => {
  try {
    const data = await User.find();
    console.log(data);
  } catch (err) {
    res.status(404).json({
      status: "fail",
    });
  }
};

const getUserByName = async (userName) => {
  const data = await User.find({ name: userName });
  return data;
};

const getUserByEmail = async (email) => {
  const data = await User.find({ email: email });
  return data;
};

const updateUser = async (name, data) => {
  try {
    const us = await getUserByName(name);
    const id = us[0]._id.toString();
    const x = await User.findByIdAndUpdate(id, data, {
      new: true,
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  connectToDB,
  getUserByName,
  getUserByEmail,
  addUser,
  updateUser,
  getAllUsers,
};