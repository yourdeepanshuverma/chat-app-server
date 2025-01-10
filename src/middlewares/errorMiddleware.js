import { envMode } from "../index.js";

const errorMiddleware = (err, _, res, next) => {
  err.message ||= "Internal Server Error";
  err.status ||= 500;

  if (err.name === "CastError") {
    err.message = `Invalid format of ${err.path}`;
    err.status = 400;
  }

  return res.status(err.status).json({
    success: false,
    message: envMode === "DEVELOPMENT" ? err : err.message,
  });
};

export { errorMiddleware };

