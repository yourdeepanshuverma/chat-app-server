import mongoose, { model, Schema, Types } from "mongoose";

const chatModel = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
      required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.models.Chat || model("Chat", chatModel);
