import { getUserSocket } from "../lib/helper.js";

export const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const userSocket = getUserSocket(users);
  io.to(userSocket).emit(event, data);
};
