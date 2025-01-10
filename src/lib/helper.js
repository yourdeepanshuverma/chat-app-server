import { userSocketIds } from "../index.js";

export const getUserSocket = (users = []) =>
  users.map((user) => userSocketIds.get(user.toString()));

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
