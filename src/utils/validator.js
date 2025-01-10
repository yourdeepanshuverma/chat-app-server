import { body, check, param } from "express-validator";
import { validationResult } from "express-validator";
import { ErrorHandler } from "./errorHandler.js";

const validatorHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");
  if (errors.isEmpty()) return next();
  else next(new ErrorHandler(400, errorMessages));
};

const registerValidator = () => [
  body("name", "Name is required").notEmpty(),
  body("username", "Username is required").notEmpty(),
  body("password", "Password is required").notEmpty(),
  body("bio", "Bio is required").notEmpty(),
  check("avatar", "Avatar is required"),
];

const loginValidator = () => [
  body("username", "Username is required").notEmpty(),
  body("password", "Password is required").notEmpty(),
];

const createNewGroupValidator = () => [
  body("name", "Name is required").notEmpty(),
  body("members", "Please add some members")
    .notEmpty()
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be between 2 and 100"),
];

const addMembersValidator = () => [
  body("chatId", "ChatId is required").notEmpty(),
  body("members", "Please add some members")
    .notEmpty()
    .isArray({ min: 1, max: 100 })
    .withMessage("Members must be between 2 and 100"),
];

const removeMemberValidator = () => [
  body("chatId", "ChatId is required").notEmpty(),
  body("userId", "UserId is required").notEmpty(),
];

const accessChatValidator = () => [param("id", "Id is required").notEmpty()];

const leaveGroupValidator = () => [
  param("id", "ChatId is required").notEmpty(),
];

const renameGroupValidator = () => [
  param("id", "Id is required").notEmpty(),
  body("name", "Name is required").notEmpty(),
];

const deleteChatValidator = () => [param("id", "Id is required").notEmpty()];

const sendAttachmentsValidator = () => [
  body("chatId", "ChatId is required").notEmpty(),
  check("files", "Files are required"),
];

const getMessagesValidator = () => [param("id", "Id is required").notEmpty()];

const sendRequestValidator = () => [
  body("userId", "UserId is required").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "RequestId is required").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Accept is required")
    .isBoolean()
    .withMessage("Accept must be boolean"),
];

export {
  acceptRequestValidator,
  sendRequestValidator,
  registerValidator,
  loginValidator,
  validatorHandler,
  createNewGroupValidator,
  addMembersValidator,
  removeMemberValidator,
  leaveGroupValidator,
  sendAttachmentsValidator,
  deleteChatValidator,
  renameGroupValidator,
  accessChatValidator,
  getMessagesValidator,
};
