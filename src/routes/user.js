const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/auth");
const {
  getReceivedRequests,
  getConnections,
  getUserFeed,
} = require("../controllers/userController");

// GET: Received Connection Requests
router.get("/requests", userAuth, getReceivedRequests);

// GET: All Accepted Connections
router.get("/connections", userAuth, getConnections);

// GET: Feed (not connected users)
router.get("/feed", userAuth, getUserFeed);

module.exports = router;
