import express from "express";
import { getAuthCookies } from "../middlewares/authMiddleware.js";
import {
  accessChat,
  addToGroup,
  createGroupChat,
  deleteChat,
  fetchChats,
  getMessages,
  getMygroups,
  leaveGroup,
  removeFromGroup,
  renameGroup,
  sendAtachment,
} from "../controllers/chatController.js";
import { attachmentsUpload } from "../middlewares/multer.js";
import {
  accessChatValidator,
  addMembersValidator,
  createNewGroupValidator,
  deleteChatValidator,
  getMessagesValidator,
  leaveGroupValidator,
  removeMemberValidator,
  renameGroupValidator,
  sendAttachmentsValidator,
  validatorHandler,
} from "../utils/validator.js";

const router = express.Router();

// Only authorized user can access these routes.
router.use(getAuthCookies);

router.route("/chat").get(fetchChats);
router.route("/mygroups").get(getMygroups);
router
  .route("/group")
  .post(createNewGroupValidator(), validatorHandler, createGroupChat);
router
  .route("/groupadd")
  .put(addMembersValidator(), validatorHandler, addToGroup);
router
  .route("/groupremove")
  .put(removeMemberValidator(), validatorHandler, removeFromGroup);
router
  .route("/groupleave/:id")
  .delete(leaveGroupValidator(), validatorHandler, leaveGroup);

router.route("/sendAttachments").post(
  attachmentsUpload,
  sendAttachmentsValidator(),
  validatorHandler,
  sendAtachment
);

router
  .route("/:id")
  .get(accessChatValidator(), validatorHandler, accessChat)
  .put(renameGroupValidator(), validatorHandler, renameGroup)
  .delete(deleteChatValidator(), validatorHandler, deleteChat);
router
  .route("/message/:id")
  .get(getMessagesValidator(), validatorHandler, getMessages);

export default router;
