const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/user");

const socketAuth = async (socket, next) => {
  try {
    let token = socket.handshake?.auth?.token;

    // Extract token from cookies if not in auth
    if (!token && socket.handshake.headers.cookie) {
      const parsedCookie = cookie.parse(socket.handshake.headers.cookie);
      token = parsedCookie.token;
    }

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    //Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user to socket instance
    socket.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }
    return next(new Error("Authentication error"));
  }
};

module.exports = socketAuth;
