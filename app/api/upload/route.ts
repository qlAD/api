import { withErrorHandler, ApiError } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_FILE_EMPTY, ERR_FILE_TOO_LARGE, ERR_FILE_TYPE } from "@/lib/error-codes";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withErrorHandler(async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new ApiError(ERR_FILE_EMPTY);
  }
  if (file.size === 0) {
    throw new ApiError(ERR_FILE_EMPTY);
  }
  if (file.size > MAX_SIZE) {
    throw new ApiError(ERR_FILE_TOO_LARGE);
  }
  if (!file.type.startsWith("image/")) {
    throw new ApiError(ERR_FILE_TYPE);
  }

  // 靶场不真写磁盘：仅返回模拟访问 URL（呼应“拿到 URL 再随笔记存”的教学点）
  const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "_");
  const url = `/uploads/${Date.now()}-${safeName}`;
  return ok({ url, filename: file.name, size: file.size, contentType: file.type });
});
