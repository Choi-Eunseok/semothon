import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Elysia, { t } from "elysia";

import getUser from "@back/guards/getUser";
import EventModel from "@back/models/event";
import JoinedActivityModel from "@back/models/joined_activity";
import TimetableModel from "@back/models/timetable";

dayjs.extend(isSameOrBefore);

const FORMAT = "YYYY-MM-DD HH:mm:ss";

const listDots = new Elysia()
  .use(getUser)
  .use(JoinedActivityModel)
  .use(TimetableModel)
  .use(EventModel)
  .get(
    "/dots",
    async ({ user, joinedActivityModel, timetableModel, eventModel, query }) => {
      const userId = user._id;
      const from = dayjs(query.from);
      const to = dayjs(query.to);

      const joined = await joinedActivityModel.db.find({ user_id: userId });
      const activityIds = joined.map((j) => j.activity_id);

      const timetables = await timetableModel.db.find({
        $or: [
          { owner_type: "user", owner: userId },
          { owner_type: "activity", owner: { $in: activityIds } },
          { owner_type: "global" },
        ],
      }).lean();

      const timetableColors = timetables.reduce<Record<string, string>>((map, tt) => {
        map[tt._id.toString()] = tt.color || "#E01732";
        return map;
      }, {});

      const timetableIds = timetables.map((t) => t._id);

      const events = await eventModel.db.find({
        timetable_id: { $in: timetableIds },
        startTime: { $lte: to.format(FORMAT) },
        endTime: { $gte: from.format(FORMAT) },
      }).lean();

      const dots: Record<string, { color: string; count: number }[]> = {};

      for (const event of events) {
        const dateKey = dayjs(event.startTime, FORMAT).format("YYYY-MM-DD");
        const color = timetableColors[event.timetable_id.toString()];

        if (!dots[dateKey]) {
          dots[dateKey] = [];
        }

        const existing = dots[dateKey].find((d) => d.color === color);
        if (existing) {
          existing.count += 1;
        } else {
          dots[dateKey].push({ color, count: 1 });
        }
      }

      return dots;
    },
    {
      query: t.Object({
        from: t.String({ format: "date", example: "2025-04-01" }),
        to: t.String({ format: "date", example: "2025-04-30" }),
      }),
      response: t.Record(
        t.String({ format: "date" }),
        t.Array(
          t.Object({
            color: t.String({ example: "#E01732" }),
            count: t.Number({ example: 2 }),
          })
        )
      ),
      detail: {
        tags: ["Timetable"],
        summary: "캘린더 dot 정보 조회",
        description: "해당 기간 동안의 이벤트를 요약하여 dot 표시용 정보로 반환합니다.",
      },
    }
  );

export default listDots;