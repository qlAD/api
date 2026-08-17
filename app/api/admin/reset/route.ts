import { withErrorHandler } from "@/lib/errors";
import { ok } from "@/lib/response";
import { resetStore } from "@/lib/store";

export const POST = withErrorHandler(async () => {
  resetStore();
  return ok({ reset: true }, "已重置为种子数据");
});
