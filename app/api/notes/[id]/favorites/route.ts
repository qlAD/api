import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_ALREADY_FAVORITED, ERR_NOTE_NOT_FOUND, ERR_NOT_FAVORITED } from "@/lib/error-codes";
import { addFavorite, findFavorite, findNote, removeFavorite } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const POST = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]/favorites">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (findFavorite(userId, id)) {
    throw new ApiError(ERR_ALREADY_FAVORITED);
  }
  addFavorite(userId, id);
  return ok({ noteId: id, favoriteCount: note.favoriteCount });
});

export const DELETE = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]/favorites">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (!findFavorite(userId, id)) {
    throw new ApiError(ERR_NOT_FAVORITED);
  }
  removeFavorite(userId, id);
  return ok({ noteId: id, favoriteCount: note.favoriteCount });
});
