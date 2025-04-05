import Elysia from "elysia";

import TimetableIdRouter from "./[id]";
import createTimetable from "./create";
import listTimetable from "./list";
import listDots from "./list-dots";

const TimetableRouter = new Elysia({
  name: "Timetable Router",
  prefix: "timetable",
})
  .use(createTimetable)
  .use(listTimetable)
  .use(listDots)
  .use(TimetableIdRouter);

export default TimetableRouter;
