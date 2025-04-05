import Elysia, { t } from "elysia";

import getNotification from "@back/guards/getNotification";
import getUser from "@back/guards/getUser";
import NotificationModel from "@back/models/notification";

const read = new Elysia()
  .use(getUser)
  .use(getNotification)
  .use(NotificationModel)
  .patch(
    "read",
    async ({ notification, notificationModel }) => {
      await notificationModel.db.updateOne(
        { _id: notification._id },
        { $set: { read: true } }
      );

      return { success: true, message: "알림을 읽음 처리했습니다." };
    },
    {
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["Notification"],
        summary: "단일 알림 읽음 처리",
        description: "특정 알림을 읽음 처리합니다.",
      },
    }
  );

export default read;