import Elysia from "elysia";

import read from "./read";

const EventIdRouter = new Elysia({
  name: "Notification Router",
  prefix: ":notification_id",
})
  .use(read);

export default EventIdRouter;