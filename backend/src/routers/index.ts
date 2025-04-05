import Elysia from "elysia";

import ActivityRouter from "./activity";
import AuthRouter from "./auth";
import EventRouter from "./event";
import NotificationRouter from "./notification";
import TimetableRouter from "./timetable";

const IndexRouter = new Elysia({
  name: "Index",
  prefix: "",
})
  .use(AuthRouter)
  .use(ActivityRouter)
  .use(TimetableRouter)
  .use(EventRouter)
  .use(NotificationRouter);

export default IndexRouter;
