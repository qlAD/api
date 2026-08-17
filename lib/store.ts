import type {
  Comment,
  FavoriteRecord,
  LikeRecord,
  Note,
  Paginated,
  UserProfile,
  User,
} from "./types";

interface Database {
  users: Map<number, User>;
  notes: Map<number, Note>;
  comments: Map<number, Comment>;
  likes: LikeRecord[];
  favorites: FavoriteRecord[];
  seq: { user: number; note: number; comment: number };
}

function iso(daysAgo = 0): string {
  const d = new Date(Date.now() - daysAgo * 86400_000);
  return d.toISOString();
}

export function toProfile(u: User): UserProfile {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
}

function buildSeed(): Database {
  const db: Database = {
    users: new Map(),
    notes: new Map(),
    comments: new Map(),
    likes: [],
    favorites: [],
    seq: { user: 100, note: 100, comment: 100 },
  };

  const teacher: User = {
    id: 1,
    username: "teacher",
    password: "123456",
    nickname: "讲师",
    avatar: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20teacher&image_size=square_hd",
    phone: "13800000001",
    bio: "训练营讲师，带你从零到一打通全栈。",
    createdAt: iso(30),
  };
  const alice: User = {
    id: 2,
    username: "alice",
    password: "123456",
    nickname: "爱丽丝",
    avatar: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20alice&image_size=square_hd",
    phone: "13800000002",
    bio: "爱折腾的前端新人。",
    createdAt: iso(20),
  };
  db.users.set(teacher.id, teacher);
  db.users.set(alice.id, alice);

  const note1: Note = {
    id: 1,
    authorId: 1,
    title: "RESTful 接口设计的三件套",
    content: "状态码、统一响应体、业务错误码，一个都不能少。前端拿到的每个响应都是同一个壳子，解析逻辑写一遍就够。",
    images: ["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=restful%20api%20design&image_size=landscape_16_9"],
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    createdAt: iso(5),
    updatedAt: iso(5),
  };
  const note2: Note = {
    id: 2,
    authorId: 2,
    title: "今天踩了跨域的坑",
    content: "前端 5173 调后端 8080，浏览器直接拦下来报 CORS。后端配个全局跨域允许就解决了。",
    images: [],
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    createdAt: iso(3),
    updatedAt: iso(3),
  };
  const note3: Note = {
    id: 3,
    authorId: 1,
    title: "my-liked-notes 的零成本复用",
    content: "点赞表本来就是用户-笔记的关联记录，换个查询方向就是‘我赞过谁’，不用单独建表。",
    images: [],
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    createdAt: iso(1),
    updatedAt: iso(1),
  };
  db.notes.set(note1.id, note1);
  db.notes.set(note2.id, note2);
  db.notes.set(note3.id, note3);

  // 种子互动
  db.likes.push({ userId: 2, noteId: 1, createdAt: iso(4) });
  db.likes.push({ userId: 1, noteId: 2, createdAt: iso(2) });
  note1.likeCount = 1;
  note2.likeCount = 1;

  db.favorites.push({ userId: 2, noteId: 1, createdAt: iso(4) });
  note1.favoriteCount = 1;

  const c1: Comment = {
    id: 1,
    noteId: 1,
    userId: 2,
    content: "讲得真清楚，三件套一下子就记住了。",
    createdAt: iso(4),
  };
  db.comments.set(c1.id, c1);
  note1.commentCount = 1;

  return db;
}

// 模块级单例（dev 热重载可能保留模块状态，内存数据在会话期内有效）
let db: Database = buildSeed();

export function resetStore(): void {
  db = buildSeed();
}

// ---- ID 生成 ----
function nextUserId(): number {
  db.seq.user += 1;
  return db.seq.user;
}
function nextNoteId(): number {
  db.seq.note += 1;
  return db.seq.note;
}
function nextCommentId(): number {
  db.seq.comment += 1;
  return db.seq.comment;
}

// ---- 用户 ----
export function listUserProfiles(): UserProfile[] {
  return [...db.users.values()].map(toProfile).sort((a, b) => a.id - b.id);
}

export function findUserById(id: number): User | undefined {
  return db.users.get(id);
}

export function findUserByUsername(username: string): User | undefined {
  return [...db.users.values()].find((u) => u.username === username);
}

export function getUserProfile(id: number): UserProfile | undefined {
  const u = db.users.get(id);
  return u ? toProfile(u) : undefined;
}

export function createUser(input: {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
}): User {
  const now = iso();
  const u: User = {
    id: nextUserId(),
    username: input.username,
    password: input.password,
    nickname: input.nickname ?? input.username,
    avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20${encodeURIComponent(input.username)}&image_size=square_hd`,
    phone: input.phone ?? "",
    bio: "",
    createdAt: now,
  };
  db.users.set(u.id, u);
  return u;
}

export function updateUser(id: number, patch: Partial<Pick<User, "nickname" | "avatar" | "phone" | "bio">>): User | undefined {
  const u = db.users.get(id);
  if (!u) return undefined;
  Object.assign(u, patch);
  return u;
}

// ---- 笔记 ----
export function createNote(input: {
  authorId: number;
  title: string;
  content: string;
  images: string[];
}): Note {
  const now = iso();
  const n: Note = {
    id: nextNoteId(),
    authorId: input.authorId,
    title: input.title,
    content: input.content,
    images: input.images,
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.notes.set(n.id, n);
  return n;
}

export function findNote(id: number): Note | undefined {
  return db.notes.get(id);
}

export function updateNote(id: number, patch: Partial<Pick<Note, "title" | "content" | "images">>): Note | undefined {
  const n = db.notes.get(id);
  if (!n) return undefined;
  Object.assign(n, patch);
  n.updatedAt = iso();
  return n;
}

export function deleteNote(id: number): boolean {
  const existed = db.notes.delete(id);
  if (!existed) return false;
  // 级联清理互动
  db.likes = db.likes.filter((l) => l.noteId !== id);
  db.favorites = db.favorites.filter((f) => f.noteId !== id);
  for (const c of [...db.comments.values()]) {
    if (c.noteId === id) db.comments.delete(c.id);
  }
  return true;
}

export function listNotes(page: number, size: number): Paginated<Note> {
  const all = [...db.notes.values()].sort((a, b) => b.id - a.id);
  const total = all.length;
  const start = (page - 1) * size;
  return { list: all.slice(start, start + size), total, page, size };
}

// ---- 点赞 ----
export function findLike(userId: number, noteId: number): LikeRecord | undefined {
  return db.likes.find((l) => l.userId === userId && l.noteId === noteId);
}

export function addLike(userId: number, noteId: number): void {
  db.likes.push({ userId, noteId, createdAt: iso() });
  const n = db.notes.get(noteId);
  if (n) n.likeCount += 1;
}

export function removeLike(userId: number, noteId: number): boolean {
  const idx = db.likes.findIndex((l) => l.userId === userId && l.noteId === noteId);
  if (idx === -1) return false;
  db.likes.splice(idx, 1);
  const n = db.notes.get(noteId);
  if (n) n.likeCount = Math.max(0, n.likeCount - 1);
  return true;
}

export function listLikedNotes(userId: number, page: number, size: number): Paginated<Note> {
  const noteIds = db.likes.filter((l) => l.userId === userId).map((l) => l.noteId);
  const notes = noteIds
    .map((id) => db.notes.get(id))
    .filter((n): n is Note => Boolean(n))
    .sort((a, b) => b.id - a.id);
  const total = notes.length;
  const start = (page - 1) * size;
  return { list: notes.slice(start, start + size), total, page, size };
}

// ---- 收藏 ----
export function findFavorite(userId: number, noteId: number): FavoriteRecord | undefined {
  return db.favorites.find((f) => f.userId === userId && f.noteId === noteId);
}

export function addFavorite(userId: number, noteId: number): void {
  db.favorites.push({ userId, noteId, createdAt: iso() });
  const n = db.notes.get(noteId);
  if (n) n.favoriteCount += 1;
}

export function removeFavorite(userId: number, noteId: number): boolean {
  const idx = db.favorites.findIndex((f) => f.userId === userId && f.noteId === noteId);
  if (idx === -1) return false;
  db.favorites.splice(idx, 1);
  const n = db.notes.get(noteId);
  if (n) n.favoriteCount = Math.max(0, n.favoriteCount - 1);
  return true;
}

export function listFavoriteNotes(userId: number, page: number, size: number): Paginated<Note> {
  const noteIds = db.favorites.filter((f) => f.userId === userId).map((f) => f.noteId);
  const notes = noteIds
    .map((id) => db.notes.get(id))
    .filter((n): n is Note => Boolean(n))
    .sort((a, b) => b.id - a.id);
  const total = notes.length;
  const start = (page - 1) * size;
  return { list: notes.slice(start, start + size), total, page, size };
}

// ---- 评论 ----
export function listCommentsByNote(noteId: number): Comment[] {
  return [...db.comments.values()].filter((c) => c.noteId === noteId).sort((a, b) => a.id - b.id);
}

export function findComment(id: number): Comment | undefined {
  return db.comments.get(id);
}

export function createComment(input: { noteId: number; userId: number; content: string }): Comment {
  const c: Comment = {
    id: nextCommentId(),
    noteId: input.noteId,
    userId: input.userId,
    content: input.content,
    createdAt: iso(),
  };
  db.comments.set(c.id, c);
  const n = db.notes.get(input.noteId);
  if (n) n.commentCount += 1;
  return c;
}

export function deleteComment(id: number): boolean {
  const c = db.comments.get(id);
  if (!c) return false;
  db.comments.delete(id);
  const n = db.notes.get(c.noteId);
  if (n) n.commentCount = Math.max(0, n.commentCount - 1);
  return true;
}
