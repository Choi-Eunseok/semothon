import Elysia, { t } from "elysia";

import activityAuthorityService from "@back/guards/activityAuthorityService";
import getActivity from "@back/guards/getActivity";
import { ApplicationStatus, ApplicationStage } from "@back/models/application";
import exit, { errorElysia } from "@back/utils/error";

const list = new Elysia()
  .use(getActivity)
  .use(activityAuthorityService())
  .get(
    "list",
    async ({ activity, applicationModel, error }) => {
      const applications = await applicationModel.db
        .find({ activityId: activity._id })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      const mappedData = applications.map((application: any) => {
        console.log("Original application:", application);
        const mapped = {
          _id: application._id.toString(),
          userId: application.userId._id.toString(),
          userName: (application.userId as any).name,
          userEmail: (application.userId as any).email,
          activityId: application.activityId.toString(),
          answers: application.answers,
          status: application.status,
          currentStage: application.currentStage,
          interviewTime: application.interviewTime,
          interviewLocation: application.interviewLocation,
          interviewNotes: application.interviewNotes,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        };
        console.log("Mapped data:", mapped);
        return mapped;
      });

      return {
        success: true,
        data: mappedData,
      };
    },
    {
      params: t.Object({
        id: t.String({ description: "동아리 ID" }),
      }),
      response: {
        200: t.Object({
          success: t.Boolean({
            description: "조회 성공 여부",
            examples: [true],
          }),
          data: t.Array(
            t.Object({
              _id: t.String({
                description: "지원서 ID",
                examples: ["507f1f77bcf86cd799439011"],
              }),
              userId: t.String({
                description: "지원자 ID",
                examples: ["507f1f77bcf86cd799439012"],
              }),
              userName: t.String({
                description: "지원자 이름",
                examples: ["홍길동"],
              }),
              userEmail: t.String({
                description: "지원자 이메일",
                examples: ["hong@example.com"],
              }),
              activityId: t.String({
                description: "동아리 ID",
                examples: ["507f1f77bcf86cd799439013"],
              }),
              answers: t.Array(
                t.Object({
                  questionId: t.String({
                    description: "질문 ID",
                    examples: ["question1"],
                  }),
                  answer: t.String({
                    description: "답변 내용",
                    examples: ["안녕하세요, 저는..."],
                  }),
                  fileUrl: t.Optional(t.String({
                    description: "첨부 파일 URL",
                    examples: ["https://example.com/file.pdf"],
                  })),
                })
              ),
              status: t.Enum(ApplicationStatus, {
                description: "지원서 상태",
                examples: [ApplicationStatus.PENDING],
              }),
              currentStage: t.Enum(ApplicationStage, {
                description: "현재 단계",
                examples: [ApplicationStage.DOCUMENT],
              }),
              interviewTime: t.Optional(t.String({
                description: "면접 시간",
                examples: ["2024-03-20 14:00:00"],
              })),
              interviewLocation: t.Optional(t.String({
                description: "면접 장소",
                examples: ["공학관 101호"],
              })),
              interviewNotes: t.Optional(t.String({
                description: "면접 관련 메모",
                examples: ["필기구 지참 필수"],
              })),
              createdAt: t.String({
                description: "생성 일시",
                examples: ["2024-03-14 12:00:00"],
              }),
              updatedAt: t.String({
                description: "수정 일시",
                examples: ["2024-03-14 12:00:00"],
              }),
            })
          ),
        }),
      },
      detail: {
        tags: ["Activity"],
        summary: "동아리 지원서 목록 조회",
        description: "특정 동아리의 모든 지원서 목록을 조회합니다. 동아리 회장/부회장만 접근 가능합니다.",
      },
    }
  );

export default list; 