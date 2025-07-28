const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const initializeSocket = require("./utils/socket");

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Only root route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 CodeMate Backend API is running!",
    status: "success",
  });
});

// NO OTHER ROUTES FOR NOW

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
