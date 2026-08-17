import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_FORBIDDEN, ERR_NOTE_EMPTY, ERR_NOTE_NOT_FOUND, ERR_PARAM } from "@/lib/error-codes";
import { deleteNote, findNote, updateNote } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const GET = withErrorHandler(async (_request: Request, ctx: RouteContext<"/api/notes/[id]">) => {
  const id = parseId((await ctx.params).id);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  return ok(note);
});

interface UpdateNoteBody {
  title?: unknown;
  content?: unknown;
  images?: unknown;
}

export const PUT = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (note.authorId !== userId) {
    throw new ApiError(ERR_FORBIDDEN, "只能修改本人笔记");
  }
  const body = (await request.json()) as UpdateNoteBody;
  const patch: { title?: string; content?: string; images?: string[] } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") throw new ApiError(ERR_PARAM, "title 需为字符串");
    patch.title = body.title.trim();
  }
  if (body.content !== undefined) {
    if (typeof body.content !== "string") throw new ApiError(ERR_PARAM, "content 需为字符串");
    patch.content = body.content.trim();
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) throw new ApiError(ERR_PARAM, "images 需为字符串数组");
    patch.images = body.images.map((v) => {
      if (typeof v !== "string") throw new ApiError(ERR_PARAM, "images 元素需为字符串");
      return v;
    });
  }
  if (patch.title === "" || patch.content === "") {
    throw new ApiError(ERR_NOTE_EMPTY);
  }
  const updated = updateNote(id, patch);
  return ok(updated!);
});

export const DELETE = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/notes/[id]">) => {
  const id = parseId((await ctx.params).id);
  const userId = requireUserId(request);
  const note = findNote(id);
  if (!note) {
    throw new ApiError(ERR_NOTE_NOT_FOUND);
  }
  if (note.authorId !== userId) {
    throw new ApiError(ERR_FORBIDDEN, "只能删除本人笔记");
  }
  deleteNote(id);
  return ok({ id });
});
