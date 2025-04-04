import Elysia, { t } from "elysia";

import eventAuthorityService from "@back/guards/eventAuthorityService";
import { eventElysiaSchema } from "@back/models/event";
import exit, { errorElysia } from "@back/utils/error";

const updateEvent = new Elysia()
  .use(eventAuthorityService)
  .patch(
    "",
    async ({ body, event, eventModel, error }) => {
      const updateData: any = {
        ...(body.title && { title: body.title }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
        ...(body.repeat && {
          repeat: {
            frequency: body.repeat.frequency ?? null,
            interval: body.repeat.interval ?? 1,
            byWeekDay: body.repeat.byWeekDay,
            bySetPosition: body.repeat.bySetPosition,
            byMonthDay: body.repeat.byMonthDay,
            until: body.repeat.until ? new Date(body.repeat.until) : undefined,
          }
        }),
      };

      const updated = await eventModel.db.updateOne(
        { _id: event._id },
        { $set: updateData },
      );

      if (!updated || updated.matchedCount < 1) {
        return exit(error, "UPDATE_FAILED");
      }

      return {
        success: true,
        message: "이벤트 수정 성공",
      };
    },
    {
      params: t.Object({
        id: t.String({ description: "이벤트 ID" }),
      }),
      body: eventElysiaSchema,
      response: {
        200: t.Object({
          success: t.Boolean({
            description: "이벤트 수정 성공 여부",
            examples: [true],
          }),
          message: t.String({
            description: "이벤트 수정 성공 메시지",
            examples: ["이벤트 수정 성공"],
          }),
        }),
        ...errorElysia(["UPDATE_FAILED"]),
      },
      detail: {
        tags: ["Event"],
        summary: "이벤트 수정",
        description: "이벤트의 제목, 시간, 반복 정보 등을 수정합니다.",
      },
    }
  );

export default updateEvent;