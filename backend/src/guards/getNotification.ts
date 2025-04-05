import Elysia, { t } from "elysia";
import { isValidObjectId } from "mongoose";

import NotificationModel, { INotification } from "@back/models/notification";
import exit, { errorElysia } from "@back/utils/error";

const getNotification = new Elysia()
  .use(NotificationModel)
  .guard({
    params: t.Object({
      notification_id: t.String({ description: "알림 ID" }),
    }),
    response: {
      ...errorElysia(["NOTIFICATION_NOT_FOUND", "INVALID_ID_TYPE"]),
    },
  })
  .resolve(async ({ params, notificationModel, error }): Promise<{ notification: INotification }> => {
    const { notification_id } = params;

    if (!isValidObjectId(notification_id)) return exit(error, "INVALID_ID_TYPE");

    const found = await notificationModel.db.findById(notification_id);

    if (!found) return exit(error, "NOTIFICATION_NOT_FOUND");

    return { notification: found.toObject() };
  })
  .as("plugin");

export default getNotification;