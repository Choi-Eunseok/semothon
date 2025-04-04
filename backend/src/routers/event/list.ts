import Elysia, { t } from "elysia";

import getUser from "@back/guards/getUser";
import EventModel from "@back/models/event";
import TimetableModel from "@back/models/timetable";
import JoinedActivityModel from "@back/models/joined_activity";

const WEEKDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const getWeekdayCode = (date: Date): string => WEEKDAY_MAP[date.getUTCDay()];

function generateRepeatInstances(event: any, from: Date, to: Date) {
  const instances = [];
  const { frequency, byWeekDay, until } = event.repeat;
  const repeatUntil = until ? new Date(until) : to;
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const duration = end.getTime() - start.getTime();

  let current = new Date(start);
  while (current <= repeatUntil && current <= to) {
    const weekday = getWeekdayCode(current);

    if (!byWeekDay || byWeekDay.includes(weekday)) {
      const instanceStart = new Date(current);
      const instanceEnd = new Date(instanceStart.getTime() + duration);
      if (instanceEnd >= from && instanceStart <= to) {
        instances.push({
          _id: event._id.toString(),
          timetable_id: event.timetable_id.toString(),
          title: event.title ?? "",
          startTime: instanceStart.toISOString(),
          endTime: instanceEnd.toISOString(),
          isAllDay: event.isAllDay ?? false,
        });
      }
    }

    switch (frequency) {
      case "daily":
        current.setUTCDate(current.getUTCDate() + 1);
        break;
      case "weekly":
        current.setUTCDate(current.getUTCDate() + 1);
        break;
      case "monthly":
        current.setUTCMonth(current.getUTCMonth() + 1);
        break;
    }
  }

  return instances;
}

const list = new Elysia()
  .use(getUser)
  .use(JoinedActivityModel)
  .use(TimetableModel)
  .use(EventModel)
  .get(
    "/list",
    async ({ user, joinedActivityModel, timetableModel, eventModel, query }) => {
      const userId = user._id;

      const from = query.from ? new Date(query.from) : new Date();
      const to = query.to ? new Date(query.to) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      let timetableIds: string[] = [];

      if (query.timetable_id) {
        timetableIds = [query.timetable_id];
      } else {
        const joined = await joinedActivityModel.db.find({ user_id: userId });
        const activityIds = joined.map(j => j.activity_id);

        const timetables = await timetableModel.db.find({
          $or: [
            { owner_type: "user", owner: userId },
            { owner_type: "activity", owner: { $in: activityIds } },
            { owner_type: "global" },
          ],
        }).lean();

        timetableIds = timetables.map((t) => t._id.toString());
      }

      const singleEvents = await eventModel.db.find({
        timetable_id: { $in: timetableIds },
        startTime: { $lte: to },
        endTime: { $gte: from },
        $or: [
          { repeat: { $exists: false } },
          { "repeat.frequency": null },
        ],
      });

      const repeatingEvents = await eventModel.db.find({
        timetable_id: { $in: timetableIds },
        "repeat.frequency": { $ne: null },
      });

      const events = [
        ...singleEvents.map((e) => ({
          _id: e._id.toString(),
          timetable_id: e.timetable_id.toString(),
          title: e.title ?? "",
          startTime: e.startTime.toISOString(),
          endTime: e.endTime.toISOString(),
          isAllDay: e.isAllDay ?? false,
        })),
        ...repeatingEvents.flatMap((e) => generateRepeatInstances(e, from, to)),
      ];

      events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return { events };
    },
    {
      query: t.Object({
        timetable_id: t.Optional(t.String({ description: "조회할 캘린더 ID" })),
        from: t.String({ format: "date", description: "조회 시작일", example: "2025-01-01" }),
        to: t.String({ format: "date", description: "조회 종료일", example: "2025-12-31" }),
      }),
      response: t.Object({
        events: t.Array(
          t.Object({
            _id: t.String(),
            timetable_id: t.String(),
            title: t.String(),
            startTime: t.String({ format: "date-time" }),
            endTime: t.String({ format: "date-time" }),
            isAllDay: t.Optional(t.Boolean()),
          })
        ),
      }),
      detail: {
        tags: ["Event"],
        summary: "이벤트 목록 조회",
        description: "`timetable_id`가 주어지면 해당 캘린더, 없으면 해당 사용자가 전체 조회 가능 캘린더의 이벤트를 반환합니다.",
      },
    }
  );

export default list;