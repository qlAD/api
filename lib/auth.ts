import { ApiError } from "./errors";
import { ERR_UNAUTHORIZED } from "./error-codes";

// 简化 token：base64(userId:timestamp)，非加密、不过期，仅演示鉴权流程
// day07 明确把 JWT 加解密留到 day08 联调
export function issueToken(userId: number): string {
  const raw = `${userId}:${Date.now()}`;
  return Buffer.from(raw, "utf-8").toString("base64");
}

export function parseToken(authHeader: string | null): number | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf-8");
    const userIdStr = decoded.split(":")[0];
    const userId = Number(userIdStr);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export function readUserId(request: Request): number | null {
  return parseToken(request.headers.get("authorization"));
}

// 需登录接口调用：解析失败抛 ApiError(10005)，由 withErrorHandler 兜成统一响应
export function requireUserId(request: Request): number {
  const userId = readUserId(request);
  if (userId === null) {
    throw new ApiError(ERR_UNAUTHORIZED);
  }
  return userId;
}
