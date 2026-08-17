// 统一响应体
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export interface Paginated<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// 用户
export interface User {
  id: number;
  username: string;
  password: string;
  nickname: string;
  avatar: string;
  phone: string;
  bio: string;
  createdAt: string;
}

// 对外暴露的用户信息（不含密码）
export type UserProfile = Omit<User, "password">;

// 笔记
export interface Note {
  id: number;
  authorId: number;
  title: string;
  content: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

// 评论
export interface Comment {
  id: number;
  noteId: number;
  userId: number;
  content: string;
  createdAt: string;
}

// 点赞记录
export interface LikeRecord {
  userId: number;
  noteId: number;
  createdAt: string;
}

// 收藏记录
export interface FavoriteRecord {
  userId: number;
  noteId: number;
  createdAt: string;
}

// 登录返回
export interface LoginResult {
  token: string;
  user: UserProfile;
}

// 接口元数据（供调试台与文档页渲染）
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type ParamLocation = "query" | "body" | "path";

export interface ParamSpec {
  name: string;
  type: string;
  required: boolean;
  location: ParamLocation;
  description: string;
  example?: string;
}

export interface ErrorRef {
  code: number;
  message: string;
}

export type ApiModule = "user" | "note" | "interaction" | "file" | "admin";

export interface ApiEndpoint {
  id: string;
  module: ApiModule;
  method: HttpMethod;
  path: string; // 含 [id] 等动态段，如 /api/notes/[id]
  title: string;
  description: string;
  authRequired: boolean;
  params: ParamSpec[];
  responseExample: unknown;
  possibleErrors: ErrorRef[];
}
