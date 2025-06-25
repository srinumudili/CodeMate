const express = require("express");
const app = express();

// app.use("/test", (req, res) => {
//   res.send("Hello World");
// });

app.get("/user", (req, res) => {
  res.send({ firstname: "Srinu", lastname: "mudili" });
});
app.post("/user", (req, res) => {
  res.send("Data successfully saved into db..");
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000...");
});
