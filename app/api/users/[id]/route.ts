import { withErrorHandler, ApiError, parseId } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_FORBIDDEN, ERR_USER_NOT_FOUND, ERR_PARAM } from "@/lib/error-codes";
import { findUserById, getUserProfile, updateUser, toProfile } from "@/lib/store";
import { requireUserId } from "@/lib/auth";

export const GET = withErrorHandler(async (_request: Request, ctx: RouteContext<"/api/users/[id]">) => {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  const profile = getUserProfile(id);
  if (!profile) {
    throw new ApiError(ERR_USER_NOT_FOUND);
  }
  return ok(profile);
});

interface UpdateBody {
  nickname?: unknown;
  avatar?: unknown;
  phone?: unknown;
  bio?: unknown;
}

export const PUT = withErrorHandler(async (request: Request, ctx: RouteContext<"/api/users/[id]">) => {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  const currentId = requireUserId(request);
  if (currentId !== id) {
    throw new ApiError(ERR_FORBIDDEN, "只能修改本人资料");
  }
  const existed = findUserById(id);
  if (!existed) {
    throw new ApiError(ERR_USER_NOT_FOUND);
  }
  const body = (await request.json()) as UpdateBody;
  const patch: Record<string, string> = {};
  if (body.nickname !== undefined) {
    if (typeof body.nickname !== "string") throw new ApiError(ERR_PARAM, "nickname 需为字符串");
    patch.nickname = body.nickname;
  }
  if (body.avatar !== undefined) {
    if (typeof body.avatar !== "string") throw new ApiError(ERR_PARAM, "avatar 需为字符串");
    patch.avatar = body.avatar;
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string") throw new ApiError(ERR_PARAM, "phone 需为字符串");
    patch.phone = body.phone;
  }
  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") throw new ApiError(ERR_PARAM, "bio 需为字符串");
    patch.bio = body.bio;
  }
  const updated = updateUser(id, patch);
  return ok(toProfile(updated!));
});
