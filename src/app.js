const express = require("express");
const app = express();
const { connectDB } = require("./config/database");

const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const appRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use("/", appRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

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
