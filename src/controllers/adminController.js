import asyncHandler from "express-async-handler";
import { Chat } from "../models/chatModel.js";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import { adminSecretKey } from "../index.js";

const getAdminData = asyncHandler(async (req, res) => {
  res.status(200).json({
    admin: true,
  });
});

// Verify admin
const verifyAdmin = asyncHandler(async (req, res, next) => {
  const { secretKey } = req.body;

  if (!secretKey || secretKey !== adminSecretKey) {
    return next(new ErrorHandler(401, "Invalid Admin Key"));
  }

  const verifiedAdmin = jwt.sign({ secretKey }, process.env.JWT_SECRET);

  res
    .status(200)
    .cookie("admin-token", verifiedAdmin, {
      maxAge: 1000 * 60 * 60 * 24 * 15,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json({
      message: "Verified Admin",
    });
});

// Logout admin
const logoutAdmin = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("admin-token", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json({
      message: "Admin Logged Out",
    });
});

// All Users.
const allUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ _id, avatar, name, username }) => {
      const [groupCount, friendCount] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        id: _id,
        name: name,
        username: username,
        avatar: avatar,
        groups: groupCount,
        friends: friendCount,
      };
    })
  );
  res.status(200).json({
    message: "All users",
    users: transformedUsers,
  });
});

// All Chats.
const allChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({})
    .populate("creator", "name avatar")
    .populate("members", "name avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ _id, name, members, groupChat, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      return {
        id: _id,
        name,
        groupChat,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          id: _id,
          name: name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar?.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  res.status(200).json({
    message: "All Chats",
    chats: transformedChats,
  });
});

// All Messages
const allMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chatId", "groupChat");

  const transformedMessages = messages.map(
    ({ _id, content, attachments, sender, chatId, createdAt }) => ({
      id: _id,
      content,
      attachments,
      chat: chatId._id,
      groupChat: chatId.groupChat,
      sender: {
        id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
      createdAt,
    })
  );

  transformedMessages.reverse();

  res.status(200).json({
    success: true,
    message: "All Messages",
    messages: transformedMessages,
  });
});

// Get dasboard status.
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const [totalUsers, totalGroups, totalMessages, totalChats] =
    await Promise.all([
      User.countDocuments(),
      Chat.countDocuments({ groupChat: true }),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(today.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: { $gte: last7Days, $lte: today },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMilliSeconds = 1000 * 60 * 60 * 24;
  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMilliSeconds;
    const index = Math.floor(indexApprox);
    messages[6 - index]++;
  });

  const stats = {
    totalChats,
    totalGroups,
    totalUsers,
    totalChats,
    totalMessages,
    messages,
  };
  res.status(200).json({
    message: "All Messages",
    stats,
  });
});

export {
  getAdminData,
  verifyAdmin,
  logoutAdmin,
  allUsers,
  allChats,
  allMessages,
  getDashboardStats,
};
