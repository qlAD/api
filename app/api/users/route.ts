import { withErrorHandler, ApiError } from "@/lib/errors";
import { created, ok } from "@/lib/response";
import { ERR_PARAM, ERR_USER_EXISTS, ERR_USERNAME_FORMAT } from "@/lib/error-codes";
import { createUser, findUserByUsername, listUserProfiles, toProfile } from "@/lib/store";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const PHONE_RE = /^1\d{10}$/;

interface RegisterBody {
  username?: unknown;
  password?: unknown;
  nickname?: unknown;
  phone?: unknown;
}

export const POST = withErrorHandler(async (request: Request) => {
  const body = (await request.json()) as RegisterBody;
  const username = body.username;
  const password = body.password;

  if (typeof username !== "string" || typeof password !== "string") {
    throw new ApiError(ERR_PARAM, "username 与 password 必填且为字符串");
  }
  if (!USERNAME_RE.test(username)) {
    throw new ApiError(ERR_USERNAME_FORMAT);
  }
  if (password.length < 6) {
    throw new ApiError(ERR_PARAM, "密码不少于 6 位");
  }
  if (findUserByUsername(username)) {
    throw new ApiError(ERR_USER_EXISTS);
  }
  const phone = typeof body.phone === "string" ? body.phone : "";
  if (phone && !PHONE_RE.test(phone)) {
    throw new ApiError(ERR_PARAM, "手机号格式错误（需 11 位且以 1 开头）");
  }
  const nickname = typeof body.nickname === "string" && body.nickname.trim() ? body.nickname.trim() : username;

  const u = createUser({ username, password, nickname, phone });
  return created(toProfile(u), "注册成功");
});

export const GET = withErrorHandler(async () => {
  return ok(listUserProfiles());
});
