import { withErrorHandler, parsePagination } from "@/lib/errors";
import { ok } from "@/lib/response";
import { listFavoriteNotes } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

// my-favorites：复用收藏表反查，不新建表
export const GET = withErrorHandler(async (request: Request) => {
  const userId = requireUserId(request);
  const { page, size } = parsePagination(new URL(request.url).searchParams);
  const result = listFavoriteNotes(userId, page, size);
  return ok(result);
});
