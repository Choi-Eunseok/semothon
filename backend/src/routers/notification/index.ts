import Elysia from "elysia";

import NotificationIdRouter from "./[id]";
import list from "./list";
import read from "./read";

const NotificationRouter = new Elysia({
  name: "Notification Router",
  prefix: "notification",
})
  .use(NotificationIdRouter)
  .use(read)
  .use(list);

export default NotificationRouter;