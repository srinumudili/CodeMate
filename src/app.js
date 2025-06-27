const express = require("express");
const app = express();
const { connectDB } = require("./config/database");
const User = require("./models/user");

app.use(express.json());

app.post("/signup", async (req, res) => {
  //Creating an instance
  const user = new User(req.body);

  try {
    await user.save();
    res.send("User Data added successfully..");
  } catch (error) {
    res.status(400).send("Error adding User Data.", error.message);
  }
});

//Get user
app.get("/user", async (req, res) => {
  const userEmail = req.query.email;

  try {
    const user = await User.find({ email: userEmail });
    if (user.length === 0) {
      res.status(404).send("User not found");
    }
    res.send(user);
  } catch (error) {
    res.status(400).send(`Something went wrong: ${error.message}`);
  }
});

// /feed get all the users
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(400).send(`Something went wrong ${error.message}`);
  }
});

connectDB()
  .then(() => {
    console.log("Database connection has established...");
    app.listen(7777, () => {
      console.log("Server is listening on port 7777...");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
