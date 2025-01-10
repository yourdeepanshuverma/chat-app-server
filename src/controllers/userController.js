import asyncHandler from "express-async-handler";
import { User } from "../models/userModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import generateToken from "../utils/generateToken.js";
import { Request } from "../models/request.js";
import { emitEvent } from "../utils/socket.js";
import { Chat } from "../models/chatModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { NEW_REQUEST } from "../constants/event.js";

// Create a new user if not exists.
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, password, bio } = req.body;

  if (!name || !username || !password)
    return next(new ErrorHandler(400, "Please Enter all the Feilds"));

  const existingUser = await User.findOne({ username });

  if (existingUser)
    return ErrorHandler(new ErrorHandler(400, "User Already Exist."));

  const uploadedFile = await uploadToCloudinary([req.file]);

  const avatar = {
    public_id: uploadedFile[0].public_id,
    url: uploadedFile[0].url,
  };

  const user = await User.create({
    name,
    username,
    password,
    bio,
    avatar,
  });

  if (user) {
    res
      .status(201)
      .cookie("Chat", generateToken(user._id), {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      })
      .json({
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      });
  } else {
    next(new ErrorHandler(400, "User not created"));
  }
});

// Login User if already exists
const loginUser = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password)
    return next(new ErrorHandler(400, "Please Enter all the Feilds"));

  const user = await User.findOne({ username }).select("+password");

  if (user && (await user.isPasswordCorrect(password))) {
    res
      .status(200)
      .cookie("Chat", generateToken(user._id), {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      })
      .json({
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      });
  } else {
    return next(new ErrorHandler(404, "Invalid Credentials"));
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("Chat", "", { maxAge: 0 }).json({
    status: true,
    message: "Logged out successfully.",
  });
});

// Get user profile
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.find({ username: req.query.username });

  if (!user) return next(new ErrorHandler(404, "User not found"));
  return res.status(200).send(user);
});

// Get my profile
const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) return next(new ErrorHandler(404, "Please login"));
  return res.status(200).send(user);
});

// Get Searhed users
const search = asyncHandler(async (req, res, next) => {
  const { name = "" } = req.query;
  const myChats = await Chat.find({
    members: req.user._id,
    groupChat: false,
  });

  const allFriends = myChats.flatMap((chat) => chat.members);

  const notMyFriend = await User.find({
    _id: { $nin: allFriends },
    username: { $regex: name, $options: "i" },
  }).find({ _id: { $ne: req.user._id } });

  res.status(200).send(notMyFriend);
});

// Send Friend request.
const sendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const request = await Request.findOne({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  });

  if (request && request.status === "pending") {
    return next(new ErrorHandler(400, "Request already sent"));
  }

  const requestSent = await Request.create({
    sender: req.user._id,
    receiver: userId,
    status: "pending",
  });

  emitEvent(req, NEW_REQUEST, [userId], "request");

  res.status(200).json({
    success: true,
    message: "Request sent successfully",
  });
});

// Accept Friend request.
const acceptRequest = asyncHandler(async (req, res, next) => {
  const { requestId, accept } = req.body;
  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) {
    return next(new ErrorHandler(400, "Request not found"));
  }

  if (req.user._id.toString() !== request.receiver._id.toString()) {
    return next(
      new ErrorHandler(400, "You are not authorized to accept this request")
    );
  }

  if (accept) {
    request.status = "accepted";
    await request.save();
    await Chat.create({
      name: `${request.sender.name}-${request.receiver.name}`,
      members: [request.sender._id, request.receiver._id],
      groupChat: false,
    });
    return res.status(200).json({
      success: true,
      message: "Request accepted successfully",
    });
  } else if (!accept) {
    request.deleteOne();
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully",
    });
  }
});

// Get Notifications
const getNotifications = asyncHandler(async (req, res, next) => {
  const requests = await Request.find({
    receiver: req.user._id,
    status: "pending",
  }).populate("sender", "name avatar");

  res.status(200).json({
    success: true,
    requests: requests,
  });
});

// Get my friends
const getMyFriends = asyncHandler(async (req, res, next) => {
  const { chatId } = req.query;

  const chats = await Chat.find({
    members: req.user._id,
    groupChat: false,
  }).populate("members", "name avatar");

  if (!chats) return next(new ErrorHandler(404, "Chat not found"));

  const friends = chats?.flatMap(({ members }) => {
    const otherMembers = members.find(
      (member) => member._id.toString() !== req.user._id.toString()
    );
    return {
      _id: otherMembers._id,
      name: otherMembers.name,
      avatar: otherMembers.avatar,
    };
  });

  if (chatId) {
    const chat = await Chat.findById(chatId).populate("members", "name avatar");

    const availableFriends = friends.filter((friend) => {
      return !chat.members.some(
        (member) => member._id.toString() === friend._id.toString()
      );
    });

    res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    res.status(200).json({
      success: true,
      friends: friends,
    });
  }
});

export {
  search,
  loginUser,
  logoutUser,
  getProfile,
  registerUser,
  sendRequest,
  acceptRequest,
  getNotifications,
  getMyProfile,
  getMyFriends,
};
