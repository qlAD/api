export type ErrorCodeCategory = "success" | "user" | "content" | "file" | "server";

export interface ErrorCodeEntry {
  code: number;
  name: string;
  message: string;
  httpStatus: number;
  category: ErrorCodeCategory;
}

// 成功
export const OK = 0;

// 用户相关 1xxxx
export const ERR_PARAM = 10001;
export const ERR_USER_EXISTS = 10002;
export const ERR_USER_NOT_FOUND = 10003;
export const ERR_PASSWORD_WRONG = 10004;
export const ERR_UNAUTHORIZED = 10005;
export const ERR_FORBIDDEN = 10006;
export const ERR_USERNAME_FORMAT = 10007;

// 内容相关 2xxxx
export const ERR_NOTE_NOT_FOUND = 20001;
export const ERR_ALREADY_LIKED = 20002;
export const ERR_NOT_LIKED = 20003;
export const ERR_COMMENT_NOT_FOUND = 20004;
export const ERR_ALREADY_FAVORITED = 20005;
export const ERR_NOT_FAVORITED = 20006;
export const ERR_PAGE_PARAM = 20007;
export const ERR_NOTE_EMPTY = 20008;

// 文件相关 3xxxx
export const ERR_FILE_EMPTY = 30001;
export const ERR_FILE_TOO_LARGE = 30002;
export const ERR_FILE_TYPE = 30003;

// 服务器
export const ERR_INTERNAL = 50000;

export const ERROR_CODES: ErrorCodeEntry[] = [
  { code: OK, name: "OK", message: "成功", httpStatus: 200, category: "success" },

  { code: ERR_PARAM, name: "ERR_PARAM", message: "参数错误", httpStatus: 400, category: "user" },
  { code: ERR_USER_EXISTS, name: "ERR_USER_EXISTS", message: "用户名已存在", httpStatus: 409, category: "user" },
  { code: ERR_USER_NOT_FOUND, name: "ERR_USER_NOT_FOUND", message: "用户不存在", httpStatus: 404, category: "user" },
  { code: ERR_PASSWORD_WRONG, name: "ERR_PASSWORD_WRONG", message: "密码错误", httpStatus: 401, category: "user" },
  { code: ERR_UNAUTHORIZED, name: "ERR_UNAUTHORIZED", message: "未登录或登录已失效", httpStatus: 401, category: "user" },
  { code: ERR_FORBIDDEN, name: "ERR_FORBIDDEN", message: "无权限操作该资源", httpStatus: 403, category: "user" },
  { code: ERR_USERNAME_FORMAT, name: "ERR_USERNAME_FORMAT", message: "用户名格式错误（需 3-20 位字母数字下划线）", httpStatus: 400, category: "user" },

  { code: ERR_NOTE_NOT_FOUND, name: "ERR_NOTE_NOT_FOUND", message: "笔记不存在", httpStatus: 404, category: "content" },
  { code: ERR_ALREADY_LIKED, name: "ERR_ALREADY_LIKED", message: "已点过赞，不能重复点赞", httpStatus: 409, category: "content" },
  { code: ERR_NOT_LIKED, name: "ERR_NOT_LIKED", message: "未点赞，无法取消", httpStatus: 409, category: "content" },
  { code: ERR_COMMENT_NOT_FOUND, name: "ERR_COMMENT_NOT_FOUND", message: "评论不存在", httpStatus: 404, category: "content" },
  { code: ERR_ALREADY_FAVORITED, name: "ERR_ALREADY_FAVORITED", message: "已收藏，不能重复收藏", httpStatus: 409, category: "content" },
  { code: ERR_NOT_FAVORITED, name: "ERR_NOT_FAVORITED", message: "未收藏，无法取消", httpStatus: 409, category: "content" },
  { code: ERR_PAGE_PARAM, name: "ERR_PAGE_PARAM", message: "分页参数错误（page/size 需为正整数）", httpStatus: 400, category: "content" },
  { code: ERR_NOTE_EMPTY, name: "ERR_NOTE_EMPTY", message: "笔记标题或内容不能为空", httpStatus: 400, category: "content" },

  { code: ERR_FILE_EMPTY, name: "ERR_FILE_EMPTY", message: "文件为空", httpStatus: 400, category: "file" },
  { code: ERR_FILE_TOO_LARGE, name: "ERR_FILE_TOO_LARGE", message: "文件过大（最大 5MB）", httpStatus: 400, category: "file" },
  { code: ERR_FILE_TYPE, name: "ERR_FILE_TYPE", message: "文件类型不支持（仅允许图片）", httpStatus: 400, category: "file" },

  { code: ERR_INTERNAL, name: "ERR_INTERNAL", message: "服务器内部错误", httpStatus: 500, category: "server" },
];

const CODE_MAP = new Map(ERROR_CODES.map((e) => [e.code, e]));

export function findErrorCode(code: number): ErrorCodeEntry | undefined {
  return CODE_MAP.get(code);
}

export function httpStatusFor(code: number): number {
  return CODE_MAP.get(code)?.httpStatus ?? 500;
}

export const CATEGORY_LABELS: Record<ErrorCodeCategory, string> = {
  success: "成功",
  user: "用户相关（1xxxx）",
  content: "内容相关（2xxxx）",
  file: "文件相关（3xxxx）",
  server: "服务器（5xxxx）",
};
