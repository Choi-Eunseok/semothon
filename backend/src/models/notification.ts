import dayjs from "dayjs";
import { Elysia } from "elysia";
import mongoose, { ObjectId } from "mongoose";

import { IDocument } from "@common/types/db";

export type NotificationType = "event_created";

interface DNotification {
  userId: ObjectId;

  senderType: "user" | "activity";
  senderId: ObjectId;
  senderName?: string;
  senderImage?: string;

  type: NotificationType;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type INotification = IDocument<DNotification>;

const notificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderType: {
    type: String,
    enum: ["user", "activity"],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  senderName: String,
  senderImage: String,

  type: {
    type: String,
    enum: ["event_created"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    default: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

const NotificationDB = mongoose.model<INotification>("Notification", notificationSchema);

const createNotification = async ({
  userId,
  senderType,
  senderId,
  senderName,
  senderImage,
  type,
  message,
  data = {},
}: {
  userId: ObjectId;
  senderType: "user" | "activity";
  senderId: ObjectId;
  senderName?: string;
  senderImage?: string;
  type: NotificationType;
  message: string;
  data?: Record<string, any>;
}) => {
  return NotificationDB.create({
    userId,
    senderType,
    senderId,
    senderName,
    senderImage,
    type,
    message,
    data,
    read: false,
    createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  });
};

const NotificationModel = new Elysia().decorate("notificationModel", {
  db: NotificationDB,
  create: createNotification,
});

export default NotificationModel;