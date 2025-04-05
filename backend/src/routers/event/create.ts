import dayjs from "dayjs";
import Elysia, { t } from "elysia";

import timetableAuthorityService from "@back/guards/timetableAuthorityService";
import ActivityModel from "@back/models/activity";
import EventModel, { eventElysiaSchema } from "@back/models/event";
import JoinedActivityModel from "@back/models/joined_activity";
import NotificationModel from "@back/models/notification";
import TimetableModel from "@back/models/timetable";
import exit, { errorElysia } from "@back/utils/error";

const FORMAT = "YYYY-MM-DD HH:mm:ss";

const normalizeRepeat = (repeat: any) => {
  if (!repeat?.frequency || repeat.frequency === "none") return undefined;

  return {
    frequency: repeat.frequency,
    interval: repeat.interval ?? 1,
    byWeekDay: repeat.byWeekDay,
    bySetPosition: repeat.bySetPosition,
    byMonthDay: repeat.byMonthDay,
    until: repeat.until ? dayjs(repeat.until).format(FORMAT) : undefined,
  };
};

const create = new Elysia()
  .use(timetableAuthorityService)
  .use(EventModel)
  .use(TimetableModel)
  .use(ActivityModel)
  .use(JoinedActivityModel)
  .use(NotificationModel)
  .post(
    "create",
    async ({ body, eventModel, timetableModel, notificationModel, activityModel, joinedActivityModel, user, error }) => {
      try {
        const repeat = normalizeRepeat(body.repeat);

        const event = await eventModel.db.create({
          timetable_id: body.timetable_id,
          title: body.title ?? "",
          startTime: dayjs(body.startTime).format(FORMAT),
          endTime: dayjs(body.endTime).format(FORMAT),
          isAllDay: body.isAllDay ?? false,
          repeat,
        });

        const timetable = await timetableModel.db.findById(body.timetable_id);
        
        if (timetable && timetable.owner_type === "activity") {
          const activity = await activityModel.db.findById(timetable.owner);
          if (activity) {
            const members = await joinedActivityModel.db.find({ activity_id: activity._id });

            for (const member of members) {
              await notificationModel.create({
                userId: member.user_id,
                senderType: "activity",
                senderId: activity._id.toString(),
                senderName: activity.name,
                senderImage: activity.logo_url ?? "",
                type: "event_created",
                message: `${event.title}`,
                data: {
                  eventId: event._id.toString(),
                  timetableId: timetable._id.toString(),
                },
              });
            }
          }
        }

        return {
          success: true,
          message: "이벤트 생성 성공",
          eventId: event._id.toString(),
        };
      } catch (err) {
        return exit(error, "INSERT_EVENT_FAILED");
      }
    },
    {
      body: t.Composite([
        t.Object({
          timetable_id: t.String({ description: "캘린더 ID" }),
        }),
        eventElysiaSchema
      ]),
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          eventId: t.String(),
        }),
        ...errorElysia(["INSERT_EVENT_FAILED"]),
      },
      detail: {
        tags: ["Event"],
        summary: "이벤트 생성 + 알림",
        description: "일반 또는 반복 이벤트를 생성합니다. `repeat` 옵션으로 고급 반복 설정도 가능합니다.",
      },
    }
  );

export default create;
