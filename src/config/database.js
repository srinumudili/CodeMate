const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Connecting to MongoDB:", process.env.DATABASE_URI);
  await mongoose.connect(process.env.DATABASE_URI);
};

module.exports = {
  connectDB,
};
