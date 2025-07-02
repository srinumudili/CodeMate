const express = require("express");
const app = express();
const { connectDB } = require("./config/database");
const User = require("./models/user");
const { validateSignupData } = require("./utils/Validation");
const bcrypt = require("bcryptjs");

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    //validating the data
    validateSignupData(req);
    const { firstName, lastName, email, password } = req.body;
    //encryptiing the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //creating an instance
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.send("User Data added successfully..");
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
});

//login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid Credentials.");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      res.send("Login Successful!");
    } else {
      throw new Error("Invalid Credentials.");
    }
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
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

//Delete one user
app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await User.findByIdAndDelete(id);
    res.send("User deleted successfully.");
  } catch (error) {
    res.status(400).send(`Something went wrong ${error.message}`);
  }
});

//Update user
app.patch("/update/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "password",
      "age",
      "gender",
    ];
    const isAllowedUpdates = Object.keys(data).every((k) =>
      allowedUpdates.includes(k)
    );
    if (!isAllowedUpdates) {
      throw new Error("Updating user is restricted!");
    }
    await User.findByIdAndUpdate(id, data);
    res.send("User Updated successfully");
  } catch (error) {
    res.status(400).send(`Something went wrong :  ${error.message}`);
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
