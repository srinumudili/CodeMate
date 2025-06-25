const express = require("express");
const app = express();
const { adminAuth } = require("./middlewares/auth");

app.use("/admin", adminAuth);

app.get("/admin/getAllData", (req, res) => {
  res.send("Admin data has succesfully sent!! ");
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000...");
});
