const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName age gender profileUrl about skills";

// ✅ Get Received Connection Requests
exports.getReceivedRequests = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    if (!connectionRequests) {
      return res.status(404).json({ message: "No Connection Requests Found" });
    }

    res.status(200).json({
      message: "Data Fetched Successfully",
      data: connectionRequests,
    });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

// ✅ Get Accepted Connections
exports.getConnections = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    }).populate([
      { path: "fromUserId", select: USER_SAFE_DATA },
      { path: "toUserId", select: USER_SAFE_DATA },
    ]);

    const data = connectionRequests.map((req) =>
      req.fromUserId._id.toString() === loggedInUser._id.toString()
        ? req.toUserId
        : req.fromUserId
    );

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: `Error: ${error.message}` });
  }
};

// ✅ Get Feed (Paginated Users not connected)
exports.getUserFeed = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hiddenUsers = new Set();
    connectionRequests.forEach((req) => {
      hiddenUsers.add(req.fromUserId.toString());
      hiddenUsers.add(req.toUserId.toString());
    });
    hiddenUsers.add(loggedInUser._id.toString());

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
};
