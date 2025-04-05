import Elysia, { t } from "elysia";

import getUser from "@back/guards/getUser";
import NotificationModel from "@back/models/notification";

const read = new Elysia()
  .use(getUser)
  .use(NotificationModel)
  .patch(
    "/read-all",
    async ({ user, notificationModel }) => {
      await notificationModel.db.updateMany(
        { userId: user._id, read: false },
        { $set: { read: true } }
      );

      return { success: true, message: "모든 알림을 읽음 처리했습니다." };
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
        summary: "전체 알림 읽음 처리",
        description: "읽지 않은 모든 알림을 읽음 처리합니다.",
      },
    }
  );

export default read;