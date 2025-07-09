const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const router = express.Router();

router.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { toUserId, status } = req.params;

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
      return res.json({ message: "Connection Request is already Exists!" });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });
    const data = await connectionRequest.save();

    res.json({ message: "Connection Request sent successfully!!", data });
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
});

router.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
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

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.status(200).json({
        message: `Connection Request has been ${status}`,
        data,
      });
    } catch (error) {
      res.status(500).send(`ERROR: ${error.message}`);
    }
  }
);

module.exports = router;
