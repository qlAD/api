import { withErrorHandler, ApiError, parsePagination } from "@/lib/errors";
import { created, ok } from "@/lib/response";
import { ERR_NOTE_EMPTY, ERR_PARAM } from "@/lib/error-codes";
import { createNote, listNotes } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

interface CreateNoteBody {
  title?: unknown;
  content?: unknown;
  images?: unknown;
}

function parseImages(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new ApiError(ERR_PARAM, "images 需为字符串数组");
  }
  const images: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") {
      throw new ApiError(ERR_PARAM, "images 中每个元素需为字符串 URL");
    }
    images.push(item);
  }
  return images;
}

export const POST = withErrorHandler(async (request: Request) => {
  const userId = requireUserId(request);
  const body = (await request.json()) as CreateNoteBody;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!title || !content) {
    throw new ApiError(ERR_NOTE_EMPTY);
  }
  const images = parseImages(body.images);
  const note = createNote({ authorId: userId, title, content, images });
  return created(note, "发布成功");
});

export const GET = withErrorHandler(async (request: Request) => {
  const { page, size } = parsePagination(new URL(request.url).searchParams);
  const result = listNotes(page, size);
  return ok(result);
});
