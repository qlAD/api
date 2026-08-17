import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_ALREADY_LIKED, ERR_NOTE_NOT_FOUND, ERR_NOT_LIKED } from "@/lib/error-codes";
import { addLike, findLike, findNote, removeLike } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const POST = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]/likes">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (findLike(userId, id)) {
    throw new ApiError(ERR_ALREADY_LIKED);
  }
  addLike(userId, id);
  return ok({ noteId: id, likeCount: note.likeCount });
});

export const DELETE = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]/likes">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (!findLike(userId, id)) {
    throw new ApiError(ERR_NOT_LIKED);
  }
  removeLike(userId, id);
  return ok({ noteId: id, likeCount: note.likeCount });
});
