import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_COMMENT_NOT_FOUND, ERR_FORBIDDEN } from "@/lib/error-codes";
import { deleteComment, findComment } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const DELETE = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/comments/[id]">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const comment = findComment(id);
  if (!comment) {
    throw new ApiError(ERR_COMMENT_NOT_FOUND);
  }
  if (comment.userId !== userId) {
    throw new ApiError(ERR_FORBIDDEN, "只能删除本人评论");
  }
  deleteComment(id);
  return ok({ id });
});
