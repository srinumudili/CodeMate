const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const router = express.Router();

const USER_SAFE_DATA = "firstName lastName age gender profileUrl about skills";

router.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    if (!connectionRequests) {
      return res.status(404).json({ message: "No Connections Requests Found" });
    }

    res.status(200).json({
      message: "Data Fetched Successfully..",
      data: connectionRequests,
    });
  } catch (error) {
    res.status(500).send(`ERROR : ${error.message}`);
  }
});

router.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        {
          toUserId: loggedInUser._id,
          status: "accepted",
        },
        {
          fromUserId: loggedInUser._id,
          status: "accepted",
        },
      ],
    }).populate([
      {
        path: "fromUserId",
        select: USER_SAFE_DATA,
      },
      {
        path: "toUserId",
        select: USER_SAFE_DATA,
      },
    ]);

    const data = connectionRequests.map((row) => {
      return row.fromUserId._id.toString() === loggedInUser._id.toString()
        ? row.toUserId
        : row.fromUserId;
    });
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
});

router.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Fetch connection requests involving the logged-in user
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    // Collect all connected user IDs in a Set
    const hiddenUsers = new Set();
    connectionRequests.forEach((req) => {
      hiddenUsers.add(req.fromUserId.toString());
      hiddenUsers.add(req.toUserId.toString());
    });

    // Add the logged-in user to the hidden list
    hiddenUsers.add(loggedInUser._id.toString());

    // Fetch users who are not connected and not the logged-in user
    const users = await User.find({
      _id: { $nin: Array.from(hiddenUsers) },
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.status(200).json({ message: "Users fetched successfully!", users });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

module.exports = router;
