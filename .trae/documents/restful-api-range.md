# 在线 RESTful API 靶场 实现计划

## 概述（Summary）

基于 day07 讲义（《当后厨开出了第一份正经菜单》——社区项目 RESTful API 全套开发），在当前 Next.js 16.3.1 工程中开发一个**在线 RESTful API 靶场**，供讲师在教学过程中为学员现场演示。

靶场包含三部分：
1. **可视化调试台**：左侧按模块分组的接口列表，右侧接口详情 + 内置请求发送器，可直接在浏览器里发请求看真实响应。
2. **接口文档页**：按 day07 业务模块展示所有接口的标准化文档（地址、方法、入参、返回体、权限、异常）。
3. **错误码表与规范说明页**：展示业务错误码分类（1xxxx 用户 / 2xxxx 内容 / 3xxxx 文件）、HTTP 状态码语义、统一响应体约定。

后端用 Next.js Route Handlers 实现全套 RESTful 接口（用户、笔记、互动含 my-liked-notes / my-favorites、文件上传），数据用内存存储 + 种子数据，鉴权用简化 token 演示流程。

## 当前状态分析（Current State Analysis）

- 工程：`c:\Users\qlAD\Documents\api`，由 `create-next-app` 生成，Next.js 16.3.1 + React 19 + Tailwind v4 + TypeScript。
- `app/` 下只有默认模板：`layout.tsx`、`page.tsx`、`globals.css`、`favicon.ico`，无任何业务代码、无 `app/api/` 目录。
- `package.json` 依赖：next、react、react-dom、tailwindcss。**无需新增任何依赖**。
- Route Handler 约定（已查 `node_modules/next/dist/docs`）：在 `app/**/route.ts` 中 `export async function GET/POST/PUT/DELETE(request: Request)`；动态参数用 `RouteContext<'/users/[id]'>` 类型化，`ctx.params` 为 Promise 需 `await`；同一层级不能同时存在 `page.tsx` 与 `route.ts`。
- `tsconfig.json` 已配置 `@/*` 路径别名指向工程根。
- day07 教学要点：统一响应体 `{code, message, data}`、HTTP 方法与资源路径分离、业务错误码前缀分类、全局异常处理、跨域（本靶场同源无需 CORS，但文档会讲解概念与 SpringBoot 配置思路以呼应教学）。
- day07 涉及的数据库表（来自讲义）：用户表、笔记表、点赞表、评论表、收藏表；接口分模块：用户、笔记、互动、文件上传。

## 提议的改动（Proposed Changes）

### 一、基础库（`lib/`）

#### 1. `lib/types.ts` — 类型定义
定义 `User`、`Note`、`Comment`、`LikeRecord`、`FavoriteRecord`、`ApiResponse<T>`、`ApiEndpoint`（接口元数据）等类型。Note 的 `images` 为 `string[]`（URL 数组，呼应讲义"图片 URL 数组直接存"）。

#### 2. `lib/error-codes.ts` — 业务错误码表
集中定义所有业务错误码，导出错误码常量与一张可读的表格（供错误码页渲染）。
- `0` 成功
- `1xxxx` 用户相关：`10001` 参数错误、`10002` 用户名已存在、`10003` 用户不存在、`10004` 密码错误、`10005` 未登录、`10006` 无权限、`10007` 用户名格式错误
- `2xxxx` 内容相关：`20001` 笔记不存在、`20002` 已点过赞、`20003` 未点赞无法取消、`20004` 评论不存在、`20005` 已收藏、`20006` 未收藏无法取消、`20007` 分页参数错误、`20008` 笔记标题或内容为空
- `3xxxx` 文件相关：`30001` 文件为空、`30002` 文件过大（>5MB）、`30003` 文件类型不支持
- `50000` 服务器内部错误

#### 3. `lib/response.ts` — 统一响应工具
提供 `ok(data, message?)` 返回 `{code:0, message, data}` + HTTP 200；`created(data, message?)` 返回 201；`fail(code, message, httpStatus)` 返回 `{code, message, data:null}` + 对应状态码（400/401/403/404/409/500）。所有接口只走这两个工具，保证响应体统一。

#### 4. `lib/store.ts` — 内存数据存储 + 种子数据
模块级 `Map` / 数组保存 users、notes、comments、likes、favorites。预置种子：2 个用户（含一个讲师账号）、3 条笔记、若干点赞/评论/收藏。提供自增 ID 生成器、`resetStore()` 重置函数、按模块的增删改查方法。**内存存储，重启丢失**——这是有意为之，保证每次演示可重置到干净状态。

#### 5. `lib/auth.ts` — 简化 token 工具
`issueToken(userId)` 返回 `base64(userId:timestamp)`（非加密，仅演示）；`parseToken(authHeader)` 解析出 userId，失败返回 null；`requireUserId(request)` 提取并校验，失败抛出可被异常处理捕获的 `ApiError(10005)`。**不实现 JWT 加解密、不设过期**——day07 明确把 JWT 留到 day08 联调。

#### 6. `lib/errors.ts` — 业务异常类 + 全局捕获辅助
`ApiError` 类（含 code、message、httpStatus）。提供 `withErrorHandler(handler)` 高阶函数包装 Route Handler，统一 try/catch：捕获 `ApiError` 转成对应响应、捕获参数校验异常转成 10001、其余转成 50000。**模拟 SpringBoot 全局异常处理器**，呼应 day07 教学点。

#### 7. `lib/api-spec.ts` — 接口元数据
集中定义所有接口的描述性元数据（method、path、title、description、authRequired、params 列表、responseExample、possibleErrors）。调试台与文档页都从此数据源渲染，保证一致。

### 二、后端 API（`app/api/`，全部 Route Handlers）

所有 handler 经 `withErrorHandler` 包装，返回统一响应体。需登录的接口调 `requireUserId`。

#### 用户模块
- `app/api/users/route.ts`：`POST` 注册（校验 username/password 非空、用户名不重复、手机号格式）、`GET` 用户列表（演示用）
- `app/api/users/login/route.ts`：`POST` 登录（校验用户存在 + 密码正确，返回 token + 用户信息）
- `app/api/users/[id]/route.ts`：`GET` 查用户信息、`PUT` 改资料（需登录 + 本人）
- `app/api/users/me/liked-notes/route.ts`：`GET` my-liked-notes（需登录，分页，复用点赞表反查 join 笔记）
- `app/api/users/me/favorites/route.ts`：`GET` my-favorites（需登录，分页，复用收藏表）

#### 笔记模块
- `app/api/notes/route.ts`：`POST` 发布笔记（需登录，images 为 URL 数组）、`GET` 列表分页（page、size 参数）
- `app/api/notes/[id]/route.ts`：`GET` 详情、`PUT` 更新（需登录 + 作者）、`DELETE` 删除（需登录 + 作者）

#### 互动模块
- `app/api/notes/[id]/likes/route.ts`：`POST` 点赞（需登录，校验未点过）、`DELETE` 取消点赞（需登录，校验已点过）
- `app/api/notes/[id]/comments/route.ts`：`GET` 评论列表、`POST` 发评论（需登录）
- `app/api/notes/[id]/favorites/route.ts`：`POST` 收藏（需登录，校验未收藏）、`DELETE` 取消收藏（需登录，校验已收藏）
- `app/api/comments/[id]/route.ts`：`DELETE` 删评论（需登录 + 评论作者）

#### 文件上传模块
- `app/api/upload/route.ts`：`POST` 接收 `multipart/form-data`（field 名 `file`），校验非空 / 大小 / 类型，返回模拟访问 URL（`/uploads/<时间戳>-<原名>`，不真写磁盘，呼应"返回 URL"教学点）

#### 数据管理
- `app/api/_admin/reset/route.ts`：`POST` 重置种子数据（演示用，文档标注为管理接口）

### 三、前端界面（`app/` 下的页面）

#### 1. `app/layout.tsx`（改）
更新 `metadata`（标题"RESTful API 靶场 · Day07"、描述）、保留 Geist 字体与基础布局。

#### 2. `app/page.tsx`（改写为首页）
靶场介绍卡片：这是什么、对应 day07 哪些知识点（RESTful 约定、统一响应体、错误码、异常处理、调试）、四个快速入口（调试台 / 接口文档 / 错误码表 / 规范说明）。底部一行教学提示：建议演示顺序（注册→登录→发笔记→列表→详情→点赞→评论→收藏→my-liked-notes→my-favorites→异常场景）。

#### 3. `app/range/page.tsx` — 调试台（核心，client component）
布局：左侧接口树（按模块分组，每项显示 HTTP 方法徽标 + 路径）；右侧选中接口详情区。
- 顶部工具条：登录态管理（显示当前 token；"快速登录"按钮调 `/api/users/login` 用种子账号获取 token；token 存 localStorage；勾选"自动带 token"则所有请求自动加 `Authorization: Bearer <token>`）。
- 接口详情：基本信息（方法、完整 URL、描述、是否需登录）；入参表（字段、类型、必填、位置 query/body/path、含义）；返回体示例（JSON）；可能异常码列表。
- 调试器：根据接口元数据自动生成可编辑的 query 参数表单、请求体 JSON 编辑器、path 参数输入；"发送"按钮用 `fetch` 调真实 `/api/*`；响应区显示 HTTP 状态码（带颜色徽标）、响应耗时、JSON 高亮响应体。
- 用 `'use client'` + Tailwind 实现，不引入额外 UI 库。

#### 4. `app/docs/page.tsx` — 接口文档
按模块分节展示所有接口的文档化描述（从 `api-spec.ts` 渲染）：地址、方法、入参表、返回体结构、权限要求、异常场景。顶部一节"规范说明"：统一响应体 `{code, message, data}` 三字段含义、RESTful 方法与资源路径分离约定、URL 命名风格（复数名词）。并附"跨域"小节：说明本靶场同源无 CORS，但在真实 SpringBoot 后端需配全局跨域允许（呼应 day07 必踩坑）。

#### 5. `app/errors/page.tsx` — 错误码表
表格按前缀分组（1xxxx / 2xxxx / 3xxxx / 5xxxx）列出所有业务错误码、含义、对应 HTTP 状态码。附 HTTP 状态码语义速查（2xx/4xx/5xx）。呼应讲义"别图省事一律返回 200"的避坑提示。

#### 6. `app/globals.css`（小改）
保留现有 Tailwind 导入，补充少量自定义工具类（HTTP 方法徽标配色、JSON 高亮、滚动条样式）。

### 四、文件结构总览

```
app/
├── layout.tsx                      （改）
├── page.tsx                        （改写为首页）
├── globals.css                     （小改）
├── range/page.tsx                  （新增 调试台）
├── docs/page.tsx                   （新增 接口文档）
├── errors/page.tsx                 （新增 错误码表）
└── api/
    ├── users/
    │   ├── route.ts
    │   ├── login/route.ts
    │   ├── [id]/route.ts
    │   └── me/
    │       ├── liked-notes/route.ts
    │       └── favorites/route.ts
    ├── notes/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       ├── likes/route.ts
    │       ├── comments/route.ts
    │       └── favorites/route.ts
    ├── comments/[id]/route.ts
    ├── upload/route.ts
    └── _admin/reset/route.ts
lib/
├── types.ts
├── error-codes.ts
├── response.ts
├── store.ts
├── auth.ts
├── errors.ts
└── api-spec.ts
```

## 假设与决策（Assumptions & Decisions）

1. **范围界定**：靶场 = 接口调试台 + 文档页 + 错误码表，**不包含完整业务前端 UI**（登录页、笔记列表页、社区首页等）。理由：聚焦 day07"接口规范与调试"主题；完整业务前端属 day08 联调内容。若你希望额外包含真实业务前端，请告知，那是另一条实现路线。
2. **数据存储**：内存 `Map` + 种子数据，重启丢失，提供 reset 接口。理由：零依赖、每次演示可重置到干净状态、适合纯教学。不引入 SQLite/JSON 文件持久化。
3. **鉴权**：简化 token（base64，不过期、不加密），仅演示鉴权流程与"需登录"接口的差别。不实现 JWT 加解密——day07 讲义明确 JWT 留到 day08。
4. **无新依赖**：全部用 Next.js + React + Tailwind 原生能力实现，不引入 UI 库 / 状态库 / 校验库。参数校验手写 if 判断（贴近讲义"后端必须兜底"的教学意图，虽提到 Bean Validation，但 JS 生态手写更直白）。
5. **跨域**：靶场同源调用无 CORS 问题；在文档页讲解跨域概念与 SpringBoot 配置思路以呼应教学。
6. **文件上传**：不真写磁盘，返回模拟 URL。理由：靶场聚焦接口契约，文件落盘无教学价值且涉及权限。
7. **接口路径风格**：复数名词（`/api/users`、`/api/notes`），资源嵌套（`/api/notes/[id]/comments`），动作靠 HTTP 方法区分——严格遵循讲义强调的 RESTful 规范。
8. **响应体统一**：所有接口（含错误）一律 `{code, message, data}`，HTTP 状态码与业务 code 配套正确（成功 200/201，客户端错误 400/401/403/404/409，服务器错误 500）。

## 验证步骤（Verification）

1. `npm run dev` 启动开发服务器，确认无编译错误。
2. 访问首页 `/`，确认靶场介绍与四个入口可点击。
3. 进入调试台 `/range`，按建议顺序逐个测试接口：
   - 注册新用户 → 登录获取 token → 勾选"自动带 token"
   - 发笔记（带 images 数组）→ 列表分页 → 详情 → 更新 → 点赞 → 发评论 → 收藏
   - my-liked-notes → my-favorites → 删评论 → 取消点赞 → 取消收藏 → 删除笔记
   - 文件上传（选个图片）→ 看返回 URL
4. 异常场景验证（每个都看 HTTP 状态码 + 业务 code）：
   - 重复注册 → 10002 + 409
   - 错误密码 → 10004 + 401
   - 不带 token 调需登录接口 → 10005 + 401
   - 重复点赞 → 20002 + 409
   - 查不存在的笔记 → 20001 + 404
   - 删除他人笔记 → 10006 + 403
   - 上传超大文件 → 30002 + 400
5. 检查所有响应体格式统一为 `{code, message, data}`。
6. 访问 `/docs` 确认接口文档完整覆盖 4 大模块；访问 `/errors` 确认错误码表按前缀分类展示。
7. 调 `/api/_admin/reset` 重置数据后，重新跑一遍主流程确认数据回到种子状态。
8. `npm run lint` 通过，无 TypeScript 类型错误。
