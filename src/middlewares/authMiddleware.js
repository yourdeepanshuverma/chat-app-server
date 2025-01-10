import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { User } from "../models/userModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";

// Authentication using Headers
const getAuthHeaders = asyncHandler(async (req, _, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      return next(new ErrorHandler(401, "Not authorized, token failed"));
    }
  }

  if (!token) {
    return next(new ErrorHandler(401, "Please login to access this route"));
  }
});

// Authentication using Cookies
const getAuthCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["Chat"];

  if (!token) {
    return next(new ErrorHandler(401, "Not authorized"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  req.user = user;

  next();
});

// Adnin Authentication using Cookies
const getAdminAuthCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["admin-token"];

  if (!token) {
    return next(new ErrorHandler(401, "Please Provide key"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.secretKey !== process.env.ADMIN_SECRET_KEY) {
    return next(new ErrorHandler(401, "Wrong input"));
  }

  next();
});

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const token = socket.request.cookies["Chat"];

    if (!token) {
      return next(new ErrorHandler(401, "Please login to access this route"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user)
      return next(new ErrorHandler(401, "Please login to access this route"));

    socket.user = user;
    return next();
  } catch (error) {
    return next(new ErrorHandler(401, "Please login to access this route"));
  }
};

export { getAuthCookies, getAdminAuthCookies, socketAuthenticator };
