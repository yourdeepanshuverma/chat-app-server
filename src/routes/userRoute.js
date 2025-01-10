import { Router } from "express";
import {
  acceptRequest,
  getMyFriends,
  getMyProfile,
  getNotifications,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  search,
  sendRequest,
} from "../controllers/userController.js";
import { getAuthCookies } from "../middlewares/authMiddleware.js";
import { avatarUpload } from "../middlewares/multer.js";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validatorHandler,
} from "../utils/validator.js";

const router = Router();

// Any user can access these routes.
router
  .route("/register")
  .post(avatarUpload, registerValidator(), validatorHandler, registerUser);
router.route("/login").post(loginValidator(), validatorHandler, loginUser);

// Only authorized user can access these routes.
router.use(getAuthCookies);

router.route("/search").get(search);
router
  .route("/sendrequest")
  .put(sendRequestValidator(), validatorHandler, sendRequest);
router
  .route("/acceptrequest")
  .put(acceptRequestValidator(), validatorHandler, acceptRequest);
router.route("/notification").get(getNotifications);
router.route("/me").get(getMyProfile);
router.route("/friends").get(getMyFriends);
router.route("/profile").get(getProfile);
router.route("/logout").get(logoutUser);

export default router;
