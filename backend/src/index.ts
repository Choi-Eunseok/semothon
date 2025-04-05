import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import Bun from "bun";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Elysia } from "elysia";
import mongoose from "mongoose";

import Crons from "./crons";
import IndexRouter from "./routers";

dayjs.extend(utc);
dayjs.extend(timezone);

mongoose.connect(Bun.env.MONGODB_URI ?? "");
const db = mongoose.connection;

const mongodb = new URL(Bun.env.MONGODB_URI ?? "");
db.on("open", console.log.bind(console, `💽 MongoDB connected to ${mongodb.hostname}:${mongodb.port}`));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const app = new Elysia()
  .use(
    cors({
      origin: true,
    }),
  )
  .use(Crons)
  .use(IndexRouter)
  .onError(({ error, code }) => {
    if (code === "NOT_FOUND") return;
    console.error(error);
  })
  .listen(8000);

if (Bun.env.NODE_ENV === "development") { 
  app.use(swagger({
    documentation: {
      info: {
        title: "세모톤 8조 API 문서",
        description: "세모톤 8조의 API 문서입니다.",
        version: "0.0.1",
      },
      tags: [
        {
          name: "Auth",
          description: "인증에 관련된 API입니다.",
        },
        {
          name: "Activity",
          description: "활동(동아리)에 관련된 API입니다.",
        },
        {
          name: "Timetable",
          description: "캘린더(시간표)에 관련된 API입니다.",
        },
        {
          name: "Event",
          description: "이벤트에 관련된 API입니다.",
        },
        {
          name: "Notification",
          description: "알림에 관련된 API입니다.",
        }
      ]
    }
  }));
}

console.log(`🕑 Reloaded at ${dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")}`);
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
