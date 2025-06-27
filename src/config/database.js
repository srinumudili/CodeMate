const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://SrinuMudili:Icon786789@devtinder.b3cfzgf.mongodb.net/devTinder"
  );
};

module.exports = {
  connectDB,
};
