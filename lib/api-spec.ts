import type { ApiEndpoint, ApiModule } from "./types";
import * as E from "./error-codes";

export const MODULE_LABELS: Record<ApiModule, string> = {
  user: "用户模块",
  note: "笔记模块",
  interaction: "互动模块",
  file: "文件上传",
  admin: "管理接口",
};

const userProfileExample = {
  id: 1,
  username: "teacher",
  nickname: "讲师",
  avatar: "https://example.com/avatar.png",
  phone: "13800000001",
  bio: "训练营讲师",
  createdAt: "2026-07-18T10:00:00.000Z",
};

const noteExample = {
  id: 1,
  authorId: 1,
  title: "RESTful 接口设计的三件套",
  content: "状态码、统一响应体、业务错误码……",
  images: ["https://example.com/1.png"],
  likeCount: 5,
  commentCount: 2,
  favoriteCount: 3,
  createdAt: "2026-08-12T10:00:00.000Z",
  updatedAt: "2026-08-12T10:00:00.000Z",
};

const commentExample = {
  id: 1,
  noteId: 1,
  userId: 2,
  content: "讲得真清楚。",
  createdAt: "2026-08-12T11:00:00.000Z",
};

const paginatedExample = <T>(item: T) => ({ list: [item], total: 1, page: 1, size: 10 });

export const API_ENDPOINTS: ApiEndpoint[] = [
  // ===== 用户模块 =====
  {
    id: "register",
    module: "user",
    method: "POST",
    path: "/api/users",
    title: "注册用户",
    description: "新用户注册。用户名需 3-20 位字母/数字/下划线，不能与已有用户重复。",
    authRequired: false,
    params: [
      { name: "username", type: "string", required: true, location: "body", description: "用户名（3-20 位字母数字下划线）", example: "bob" },
      { name: "password", type: "string", required: true, location: "body", description: "密码（不少于 6 位）", example: "123456" },
      { name: "nickname", type: "string", required: false, location: "body", description: "昵称，缺省时同用户名", example: "鲍勃" },
      { name: "phone", type: "string", required: false, location: "body", description: "手机号（11 位数字）", example: "13800000099" },
    ],
    responseExample: { code: 0, message: "created", data: userProfileExample },
    possibleErrors: [
      { code: E.ERR_PARAM, message: "参数错误" },
      { code: E.ERR_USERNAME_FORMAT, message: "用户名格式错误" },
      { code: E.ERR_USER_EXISTS, message: "用户名已存在" },
    ],
  },
  {
    id: "login",
    module: "user",
    method: "POST",
    path: "/api/users/login",
    title: "登录",
    description: "用户名 + 密码登录，成功后返回简化 token 与用户信息。后续需登录的接口请在 Authorization 头携带 Bearer token。",
    authRequired: false,
    params: [
      { name: "username", type: "string", required: true, location: "body", description: "用户名", example: "teacher" },
      { name: "password", type: "string", required: true, location: "body", description: "密码", example: "123456" },
    ],
    responseExample: { code: 0, message: "success", data: { token: "MToxNzU3Li4u", user: userProfileExample } },
    possibleErrors: [
      { code: E.ERR_PARAM, message: "参数错误" },
      { code: E.ERR_USER_NOT_FOUND, message: "用户不存在" },
      { code: E.ERR_PASSWORD_WRONG, message: "密码错误" },
    ],
  },
  {
    id: "listUsers",
    module: "user",
    method: "GET",
    path: "/api/users",
    title: "用户列表",
    description: "返回所有用户（演示用，不含密码）。",
    authRequired: false,
    params: [],
    responseExample: { code: 0, message: "success", data: [userProfileExample] },
    possibleErrors: [],
  },
  {
    id: "getUser",
    module: "user",
    method: "GET",
    path: "/api/users/[id]",
    title: "查用户信息",
    description: "按 ID 查询用户公开信息。",
    authRequired: false,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "用户 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: userProfileExample },
    possibleErrors: [
      { code: E.ERR_USER_NOT_FOUND, message: "用户不存在" },
    ],
  },
  {
    id: "updateUser",
    module: "user",
    method: "PUT",
    path: "/api/users/[id]",
    title: "修改资料",
    description: "修改昵称、头像、手机号、简介。需登录且只能改本人资料。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "用户 ID", example: "1" },
      { name: "nickname", type: "string", required: false, location: "body", description: "昵称", example: "讲师改名" },
      { name: "avatar", type: "string", required: false, location: "body", description: "头像 URL", example: "https://example.com/a.png" },
      { name: "phone", type: "string", required: false, location: "body", description: "手机号", example: "13800000001" },
      { name: "bio", type: "string", required: false, location: "body", description: "个人简介", example: "更新了简介" },
    ],
    responseExample: { code: 0, message: "success", data: userProfileExample },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_FORBIDDEN, message: "无权限" },
      { code: E.ERR_USER_NOT_FOUND, message: "用户不存在" },
    ],
  },
  {
    id: "myLikedNotes",
    module: "user",
    method: "GET",
    path: "/api/users/me/liked-notes",
    title: "我赞过的笔记",
    description: "复用点赞表反查当前用户点过赞的笔记，分页返回。零成本复用，不新建表。",
    authRequired: true,
    params: [
      { name: "page", type: "integer", required: false, location: "query", description: "页码，默认 1", example: "1" },
      { name: "size", type: "integer", required: false, location: "query", description: "每页条数，默认 10，最大 100", example: "10" },
    ],
    responseExample: { code: 0, message: "success", data: paginatedExample(noteExample) },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_PARAM, message: "分页参数错误" },
    ],
  },
  {
    id: "myFavorites",
    module: "user",
    method: "GET",
    path: "/api/users/me/favorites",
    title: "我收藏的笔记",
    description: "复用收藏表反查当前用户收藏的笔记，分页返回。",
    authRequired: true,
    params: [
      { name: "page", type: "integer", required: false, location: "query", description: "页码，默认 1", example: "1" },
      { name: "size", type: "integer", required: false, location: "query", description: "每页条数，默认 10，最大 100", example: "10" },
    ],
    responseExample: { code: 0, message: "success", data: paginatedExample(noteExample) },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_PARAM, message: "分页参数错误" },
    ],
  },

  // ===== 笔记模块 =====
  {
    id: "createNote",
    module: "note",
    method: "POST",
    path: "/api/notes",
    title: "发布笔记",
    description: "发布一条笔记。images 为图片 URL 数组（先调文件上传接口拿到 URL，再随笔记一起存）。",
    authRequired: true,
    params: [
      { name: "title", type: "string", required: true, location: "body", description: "标题", example: "今天学了 RESTful" },
      { name: "content", type: "string", required: true, location: "body", description: "正文", example: "三件套：状态码、响应体、错误码" },
      { name: "images", type: "string[]", required: false, location: "body", description: "图片 URL 数组", example: '["https://example.com/1.png"]' },
    ],
    responseExample: { code: 0, message: "created", data: noteExample },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_EMPTY, message: "标题或内容为空" },
    ],
  },
  {
    id: "listNotes",
    module: "note",
    method: "GET",
    path: "/api/notes",
    title: "笔记列表（分页）",
    description: "分页查询笔记，按 ID 倒序。",
    authRequired: false,
    params: [
      { name: "page", type: "integer", required: false, location: "query", description: "页码，默认 1", example: "1" },
      { name: "size", type: "integer", required: false, location: "query", description: "每页条数，默认 10", example: "10" },
    ],
    responseExample: { code: 0, message: "success", data: paginatedExample(noteExample) },
    possibleErrors: [
      { code: E.ERR_PARAM, message: "分页参数错误" },
    ],
  },
  {
    id: "getNote",
    module: "note",
    method: "GET",
    path: "/api/notes/[id]",
    title: "笔记详情",
    description: "按 ID 查询笔记详情。",
    authRequired: false,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: noteExample },
    possibleErrors: [
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
    ],
  },
  {
    id: "updateNote",
    module: "note",
    method: "PUT",
    path: "/api/notes/[id]",
    title: "更新笔记",
    description: "整体更新笔记标题、正文、配图。需登录且为作者本人。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
      { name: "title", type: "string", required: false, location: "body", description: "标题", example: "改过的标题" },
      { name: "content", type: "string", required: false, location: "body", description: "正文", example: "改过的正文" },
      { name: "images", type: "string[]", required: false, location: "body", description: "图片 URL 数组", example: "[]" },
    ],
    responseExample: { code: 0, message: "success", data: noteExample },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_FORBIDDEN, message: "无权限" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_NOTE_EMPTY, message: "标题或内容为空" },
    ],
  },
  {
    id: "deleteNote",
    module: "note",
    method: "DELETE",
    path: "/api/notes/[id]",
    title: "删除笔记",
    description: "删除笔记并级联清理其下点赞、评论、收藏。需登录且为作者本人。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { id: 1 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_FORBIDDEN, message: "无权限" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
    ],
  },

  // ===== 互动模块 =====
  {
    id: "likeNote",
    module: "interaction",
    method: "POST",
    path: "/api/notes/[id]/likes",
    title: "点赞",
    description: "当前用户对某条笔记点赞。不能重复点赞。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { noteId: 1, likeCount: 6 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_ALREADY_LIKED, message: "已点过赞" },
    ],
  },
  {
    id: "unlikeNote",
    module: "interaction",
    method: "DELETE",
    path: "/api/notes/[id]/likes",
    title: "取消点赞",
    description: "取消当前用户对某条笔记的点赞。未点过赞时无法取消。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { noteId: 1, likeCount: 4 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_NOT_LIKED, message: "未点赞无法取消" },
    ],
  },
  {
    id: "listComments",
    module: "interaction",
    method: "GET",
    path: "/api/notes/[id]/comments",
    title: "评论列表",
    description: "查询某条笔记下的评论，按时间正序。",
    authRequired: false,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: [commentExample] },
    possibleErrors: [
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
    ],
  },
  {
    id: "createComment",
    module: "interaction",
    method: "POST",
    path: "/api/notes/[id]/comments",
    title: "发表评论",
    description: "对某条笔记发表评论。需登录。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
      { name: "content", type: "string", required: true, location: "body", description: "评论内容", example: "写得很清楚！" },
    ],
    responseExample: { code: 0, message: "created", data: commentExample },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_PARAM, message: "评论内容为空" },
    ],
  },
  {
    id: "deleteComment",
    module: "interaction",
    method: "DELETE",
    path: "/api/comments/[id]",
    title: "删除评论",
    description: "删除一条评论。需登录且为评论作者本人。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "评论 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { id: 1 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_FORBIDDEN, message: "无权限" },
      { code: E.ERR_COMMENT_NOT_FOUND, message: "评论不存在" },
    ],
  },
  {
    id: "favoriteNote",
    module: "interaction",
    method: "POST",
    path: "/api/notes/[id]/favorites",
    title: "收藏",
    description: "当前用户收藏某条笔记。不能重复收藏。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { noteId: 1, favoriteCount: 4 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_ALREADY_FAVORITED, message: "已收藏" },
    ],
  },
  {
    id: "unfavoriteNote",
    module: "interaction",
    method: "DELETE",
    path: "/api/notes/[id]/favorites",
    title: "取消收藏",
    description: "取消当前用户对某条笔记的收藏。未收藏时无法取消。",
    authRequired: true,
    params: [
      { name: "id", type: "integer", required: true, location: "path", description: "笔记 ID", example: "1" },
    ],
    responseExample: { code: 0, message: "success", data: { noteId: 1, favoriteCount: 2 } },
    possibleErrors: [
      { code: E.ERR_UNAUTHORIZED, message: "未登录" },
      { code: E.ERR_NOTE_NOT_FOUND, message: "笔记不存在" },
      { code: E.ERR_NOT_FAVORITED, message: "未收藏无法取消" },
    ],
  },

  // ===== 文件上传 =====
  {
    id: "upload",
    module: "file",
    method: "POST",
    path: "/api/upload",
    title: "文件上传",
    description: "接收 multipart/form-data（字段名 file），校验非空、大小（≤5MB）、类型（仅图片），返回访问 URL。靶场不真写磁盘，URL 为模拟值。",
    authRequired: false,
    params: [
      { name: "file", type: "file", required: true, location: "body", description: "待上传文件（multipart 字段名 file）", example: "(选择文件)" },
    ],
    responseExample: { code: 0, message: "success", data: { url: "/uploads/1757xxx-photo.png", filename: "photo.png", size: 102400 } },
    possibleErrors: [
      { code: E.ERR_FILE_EMPTY, message: "文件为空" },
      { code: E.ERR_FILE_TOO_LARGE, message: "文件过大" },
      { code: E.ERR_FILE_TYPE, message: "文件类型不支持" },
    ],
  },

  // ===== 管理 =====
  {
    id: "reset",
    module: "admin",
    method: "POST",
    path: "/api/admin/reset",
    title: "重置种子数据",
    description: "把内存数据重置为初始种子状态，方便演示前清场。仅教学演示用。",
    authRequired: false,
    params: [],
    responseExample: { code: 0, message: "success", data: { reset: true } },
    possibleErrors: [],
  },
];

export function endpointsByModule(): Record<ApiModule, ApiEndpoint[]> {
  const result: Record<ApiModule, ApiEndpoint[]> = {
    user: [],
    note: [],
    interaction: [],
    file: [],
    admin: [],
  };
  for (const ep of API_ENDPOINTS) {
    result[ep.module].push(ep);
  }
  return result;
}
