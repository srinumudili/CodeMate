const express = require("express");
const app = express();

app.use(
  "/user",
  (req, res, next) => {
    console.log("Request handler!!");
    // res.send("Response!");
    next();
  },
  (req, res, next) => {
    console.log("Request handler2!!");
    // res.send("2nd Response!");
    next();
  },
  (req, res, next) => {
    console.log("Request handler3!!");
    // res.send("3nd Response!");
    next();
  },
  (req, res, next) => {
    console.log("Request handler4!!");
    // res.send("4th Response!");
    next();
  },
  (req, res, next) => {
    console.log("Request handler5!!");
    res.send("5th Response!");
  }
);

app.listen(3000, () => {
  console.log("Server is listening on port 3000...");
});
