const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const initializeSocket = require("./utils/socket");

dotenv.config();

const app = express();

// ✅ CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    message: "🚀 CodeMate Backend API is running!",
    status: "success",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      profile: "/api/profile",
      requests: "/api/requests",
      user: "/api/user",
      chat: "/api/chat",
    },
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "CodeMate API endpoints",
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const requestRoutes = require("./routes/request");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");

// ✅ Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// ✅ Start server with socket
const server = http.createServer(app);
initializeSocket(server);

// ✅ Connect DB and run server
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 7777;
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/`);
      console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
