import { withErrorHandler, parsePagination } from "@/lib/errors";
import { ok } from "@/lib/response";
import { listLikedNotes } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

// my-liked-notes：复用点赞表反查，不新建表
export const GET = withErrorHandler(async (request: Request) => {
  const userId = requireUserId(request);
  const { page, size } = parsePagination(new URL(request.url).searchParams);
  const result = listLikedNotes(userId, page, size);
  return ok(result);
});
