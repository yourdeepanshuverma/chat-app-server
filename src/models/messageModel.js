import mongoose, { model, Schema, Types } from "mongoose";

const messageSchema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    chatId: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    attachments: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message =
  mongoose.models.Message || model("Message", messageSchema);
