import { withErrorHandler, ApiError } from "@/lib/errors";
import { ok } from "@/lib/response";
import { ERR_PARAM, ERR_PASSWORD_WRONG, ERR_USER_NOT_FOUND } from "@/lib/error-codes";
import { findUserByUsername, toProfile } from "@/lib/store";
import { issueToken } from "@/lib/auth";
import type { LoginResult } from "@/lib/types";

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

export const POST = withErrorHandler(async (request: Request) => {
  const body = (await request.json()) as LoginBody;
  const username = body.username;
  const password = body.password;
  if (typeof username !== "string" || typeof password !== "string") {
    throw new ApiError(ERR_PARAM, "username 与 password 必填");
  }
  const user = findUserByUsername(username);
  if (!user) {
    throw new ApiError(ERR_USER_NOT_FOUND);
  }
  if (user.password !== password) {
    throw new ApiError(ERR_PASSWORD_WRONG);
  }
  const token = issueToken(user.id);
  const result: LoginResult = { token, user: toProfile(user) };
  return ok(result, "登录成功");
});
