import Elysia, { t } from "elysia";

import getUser from "@back/guards/getUser";
import NotificationModel from "@back/models/notification";

const list = new Elysia()
  .use(getUser)
  .use(NotificationModel)
  .get(
    "list",
    async ({ query, user, notificationModel }) => {
      const { read } = query;

      const filter: Record<string, any> = { userId: user._id };
      if (read !== undefined) {
        filter.read = read === "true";
      }

      const notifications = await notificationModel.db
        .find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        data: notifications.map((n) => ({
          _id: n._id.toString(),
          senderType: n.senderType,
          senderId: n.senderId.toString(),
          senderName: n.senderName,
          senderImage: n.senderImage,
          type: n.type,
          message: n.message,
          data: n.data,
          read: n.read,
          createdAt: n.createdAt,
        })),
      };
    },
    {
      query: t.Object({
        read: t.Optional(t.String({ description: "읽음 여부 필터: true / false" })),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(
          t.Object({
            _id: t.String(),
            senderType: t.Enum({ user: "user", activity: "activity" }),
            senderId: t.String(),
            senderName: t.Optional(t.String()),
            senderImage: t.Optional(t.String()),
            type: t.String(),
            message: t.String(),
            data: t.Optional(t.Record(t.String(), t.Any())),
            read: t.Boolean(),
            createdAt: t.String(),
          })
        ),
      }),
      detail: {
        tags: ["Notification"],
        summary: "알림 목록 조회",
        description: "사용자의 알림 목록을 최신순으로 반환합니다. `read=true/false`로 필터링할 수 있습니다.",
      },
    }
  );

export default list;
