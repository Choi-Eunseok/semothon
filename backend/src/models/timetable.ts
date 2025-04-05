import Bun from "bun";
import Elysia, { t } from "elysia";
import { SignJWT, jwtVerify } from "jose";
import mongoose, { ObjectId } from "mongoose";

import { IDocument } from "@common/types/db";

type Visibility = "public" | "member";

interface DTimetableBase {
  name: string;
  owner_type: "user" | "global" | "activity";
  owner: ObjectId;
  color?: string;
}

interface DActivityTimetable extends DTimetableBase {
  owner_type: "activity";
  visibility: Visibility;
}

interface DOtherTimetable extends DTimetableBase {
  owner_type: "user" | "global";
  visibility?: never;
}

type DTimetable = DActivityTimetable | DOtherTimetable;
export type ITimetable = IDocument<DTimetable>;

export type MappedTimetable =
| {
    _id: string;
    name: string;
    owner_type: "user" | "global";
    owner: string;
    color?: string;
  }
| {
    _id: string;
    name: string;
    owner_type: "activity";
    owner: string;
    visibility: "public" | "member";
    color?: string;
  };

export const timetableElysiaSchema = t.Union([
  t.Object({
    _id: t.String(),
    name: t.String(),
    owner_type: t.Literal("activity"),
    owner: t.String(),
    visibility: t.Enum({ public: "public", member: "member" }, { description: "공개 범위" }),
    color: t.Optional(t.String({ description: "캘린더 색상 코드", example: "#FFAE00" })),
  }),
  t.Object({
    _id: t.String(),
    name: t.String(),
    owner_type: t.Enum({ user: "user", global: "global" }),
    owner: t.String(),
    color: t.Optional(t.String({ description: "캘린더 색상 코드", example: "#FF0000" })),
  }),
]);

const timetableSchema = new mongoose.Schema<ITimetable>({
  name: { type: String, required: true },
  owner_type: {
    type: String,
    enum: ["activity", "user", "global"],
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "owner_type",
  },
  visibility: {
    type: String,
    enum: ["public", "member"],
    required: function (this: any) {
      return this.owner_type === "activity";
    },
    default: "member",
  },
  color: {
    type: String,
    default: "#E01732",
  },
});

const TimetableDB = mongoose.model<ITimetable>("Timetable", timetableSchema);

const generateIcsAccessToken = async (timetableId: string, userId: string) => {
  const secret = new TextEncoder().encode(Bun.env.JWT_SECRET ?? "");
  return await new SignJWT({ tid: timetableId, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(secret);
};

const verifyIcsAccessToken = async (token: string): Promise<{ tid: string; uid: string }> => {
  const secret = new TextEncoder().encode(Bun.env.JWT_SECRET ?? "");
  const { payload } = await jwtVerify(token, secret);
  return payload as { tid: string; uid: string };
};

const TimetableModel = new Elysia()
  .decorate("timetableModel", {
    db: TimetableDB,
    generateIcsAccessToken,
    verifyIcsAccessToken,
  });

export default TimetableModel;