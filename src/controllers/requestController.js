const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

exports.sendConnectionRequest = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { toUserId } = req.params;
    const { status } = req.body;

    const allowedStatus = ["interested", "ignored"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: `Invalid Status Type ${status}` });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "User NOT Found." });
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      return res.json({ message: "Connection Request already exists!" });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const data = await connectionRequest.save();

    res.status(200).json({
      message: "Connection Request sent successfully!!",
      data,
    });
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
};

exports.reviewConnectionRequest = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { requestId } = req.params;
    console.log("REQ BODY:", req.body);
    const { status } = req.body;

    const allowedStatus = ["accepted", "rejected"];
    const normalizedStatus = status?.toLowerCase()?.trim();

    if (!allowedStatus.includes(normalizedStatus)) {
      return res
        .status(400)
        .json({ message: `Invalid status type: ${status}` });
    }

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      return res.status(404).json({
        message: "Connection Request not found or already reviewed",
      });
    }

    connectionRequest.status = normalizedStatus;
    const data = await connectionRequest.save();

    res.status(200).json({
      message: `Connection Request has been ${normalizedStatus}`,
      data,
    });
  } catch (error) {
    res.status(500).send(`ERROR: ${error.message}`);
  }
};
