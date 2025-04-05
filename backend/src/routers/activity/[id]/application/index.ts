import Elysia from "elysia";

import getActivity from "@back/guards/getActivity";

import list from "./list";

const applicationRouter = new Elysia({
  name: "Application Router",
  prefix: "application",
})
  .use(getActivity)
  .use(list);

export default applicationRouter; 