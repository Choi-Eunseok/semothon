import Elysia, { t } from "elysia";
import { ObjectId } from "mongoose";

import TimetableModel from "@back/models/timetable";
import exit, { errorElysia } from "@back/utils/error";

const createTimetable = new Elysia().use(TimetableModel).post(
  "",
  async ({ body, timetableModel, error }) => {
    try {
      const { name, owner, owner_type, color } = body;
      const data: any = {
        name,
        owner,
        owner_type,
        ...(color && { color }),
      };

      if (owner_type === "activity") {
        data.visibility = body.visibility ?? "member";
      }

      const timetable = await timetableModel.db.create(data);

      return {
        message: "Timetable created",
        timetableId: (timetable._id as ObjectId).toString(),
      };
    } catch (err) {
      return exit(error, "INSERT_TIMETABLE_FAILED");
    }
  },
  {
    body: t.Union([
      t.Object({
        name: t.Optional(t.String({ description: "캘린더 이름" })),
        owner_type: t.Literal("activity"),
        owner: t.String({ description: "활동 ID (ObjectId)" }),
        visibility: t.Optional(t.Enum({ public: "public", member: "member" }, { description: "공개 범위" })),
        color: t.Optional(t.String({ description: "캘린더 색상 (hex format)", example: "#FFAE00" })),
      }),
      t.Object({
        name: t.Optional(t.String({ description: "캘린더 이름" })),
        owner_type: t.Enum({ user: "user", global: "global" }),
        owner: t.String({ description: "사용자 ID (ObjectId)" }),
        color: t.Optional(t.String({ description: "캘린더 색상 (hex format)", example: "#FF0000" })),
      }),
    ]),
    response: {
      200: t.Object({
        message: t.String(),
        timetableId: t.String(),
      }),
      ...errorElysia(["INSERT_TIMETABLE_FAILED"]),
    },
    detail: {
      tags: ["Timetable"],
      summary: "캘린더(시간표) 생성",
      description: "\"global\", \"user\", \"activity\" 모든 경우에 owner는 필수이며, \"activity\"일 경우만 visibility 필드가 유효합니다.",
    },
  }
);

export default createTimetable;