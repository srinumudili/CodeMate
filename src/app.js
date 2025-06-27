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
