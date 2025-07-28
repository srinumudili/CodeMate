const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const initializeSocket = require("./utils/socket");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check / root route
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

// API health check
app.get("/api", (req, res) => {
  res.json({
    message: "CodeMate API endpoints",
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const requestRoutes = require("./routes/request");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");

// Mount routes with proper prefixes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

// Handle 404 fallback safely without "*"
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Something went wrong",
  });
});

// Create server and attach socket
const server = http.createServer(app);
initializeSocket(server);

// Connect DB and start server
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 3000;
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
