import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { created, ok } from "@/lib/response";
import { ERR_NOTE_NOT_FOUND, ERR_PARAM } from "@/lib/error-codes";
import { createComment, findNote, listCommentsByNote } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const GET = withErrorHandler(async (_request: Request, ctx: RouteContext<"/api/notes/[id]/comments">) => {
  const id = parseId((await ctx.params).id);
  if (!findNote(id)) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  return ok(listCommentsByNote(id));
});

interface CreateCommentBody {
  content?: unknown;
}

export const POST = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]/comments">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  if (!findNote(id)) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  const body = (await request.json()) as CreateCommentBody;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    throw new ApiError(ERR_PARAM, "评论内容不能为空");
  }
  const comment = createComment({ noteId: id, userId, content });
  return created(comment, "评论成功");
});
