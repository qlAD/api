import Link from "next/link";
import { API_ENDPOINTS, MODULE_LABELS } from "@/lib/api-spec";
import type { ApiModule, HttpMethod } from "@/lib/types";

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  DELETE: "method-delete",
};

const MODULE_ORDER: ApiModule[] = ["user", "note", "interaction", "file", "admin"];

function TopNav() {
  return (
    <nav className="flex items-center gap-4 border-b border-zinc-200 bg-white px-6 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← 首页
      </Link>
      <span className="text-zinc-300 dark:text-zinc-700">|</span>
      <Link href="/range" className="text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400">
        调试台
      </Link>
      <Link href="/docs" className="font-semibold text-blue-600 dark:text-blue-400">
        接口文档
      </Link>
      <Link href="/errors" className="text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400">
        错误码表
      </Link>
    </nav>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          接口文档
        </h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          社区项目全套 RESTful 接口，按业务模块分组。所有响应遵循统一格式。
        </p>

        {/* 规范说明 */}
        <section id="specification" className="mb-12 scroll-mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            规范说明
          </h2>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              统一响应体
            </h3>
            <p className="mb-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              不管哪个接口，返回的 JSON 都长一个样。前端解析逻辑写一遍就够。
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100 dark:bg-zinc-950">{`{
  "code": 0,            // 业务状态码：0 成功，非 0 失败
  "message": "success", // 一句话告诉前端发生了啥
  "data": { ... }       // 真正的数据，可能是对象、列表或 null
}`}</pre>
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              RESTful 方法与资源路径分离
            </h3>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              URL 只描述「资源是什么」，HTTP 方法描述「对资源做什么」，两者分离，接口干净一致。
              删评论写成 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">DELETE /comments/1</code>，
              而不是 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">POST /comment/delete?id=1</code>。
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <li><span className="method-badge method-get">GET</span> <span className="ml-1 text-zinc-600 dark:text-zinc-400">取资源</span></li>
              <li><span className="method-badge method-post">POST</span> <span className="ml-1 text-zinc-600 dark:text-zinc-400">新增</span></li>
              <li><span className="method-badge method-put">PUT</span> <span className="ml-1 text-zinc-600 dark:text-zinc-400">更新</span></li>
              <li><span className="method-badge method-delete">DELETE</span> <span className="ml-1 text-zinc-600 dark:text-zinc-400">删除</span></li>
            </ul>
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              URL 命名风格
            </h3>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              资源用复数名词：<code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/users</code>、
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/notes</code>。
              资源嵌套：<code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/notes/&#123;id&#125;/comments</code> 表示某条笔记下的评论。
              「我赞过的笔记」用 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/users/me/liked-notes</code>，me 代表当前登录用户。
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              跨域（CORS）
            </h3>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              本靶场前端与接口同源，不存在跨域问题。但真实联调时，前端在 5173、后端在 8080，浏览器会拦截跨域请求。
              在 SpringBoot 后端需配一个全局跨域允许，告诉浏览器「8080 愿意接待来自 5173 的请求」。
              这个坑不解决，联调第一秒就翻车——所以跨域配置要在后端开发阶段就立好。
            </p>
          </div>
        </section>

        {/* 按模块分节 */}
        {MODULE_ORDER.map((mod) => {
          const eps = API_ENDPOINTS.filter((e) => e.module === mod);
          if (eps.length === 0) return null;
          return (
            <section key={mod} className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="h-5 w-1 rounded bg-blue-600" />
                {MODULE_LABELS[mod]}
              </h2>
              <div className="space-y-5">
                {eps.map((ep) => (
                  <div
                    key={ep.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`method-badge ${METHOD_CLASS[ep.method]}`}>{ep.method}</span>
                      <code className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                        {ep.path}
                      </code>
                      {ep.authRequired && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          需登录
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {ep.title}
                    </h3>
                    <p className="mb-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {ep.description}
                    </p>

                    {ep.params.length > 0 && (
                      <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-500">字段</th>
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-500">类型</th>
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-500">位置</th>
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-500">必填</th>
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-500">说明</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {ep.params.map((p) => (
                              <tr key={p.name} className="text-zinc-700 dark:text-zinc-300">
                                <td className="px-2 py-1.5 font-mono">{p.name}</td>
                                <td className="px-2 py-1.5 font-mono text-blue-600 dark:text-blue-400">{p.type}</td>
                                <td className="px-2 py-1.5">{p.location}</td>
                                <td className="px-2 py-1.5">
                                  {p.required ? <span className="text-red-500">是</span> : <span className="text-zinc-400">否</span>}
                                </td>
                                <td className="px-2 py-1.5 text-zinc-500">{p.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">返回体示例</div>
                      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100 dark:bg-zinc-950">
                        {JSON.stringify(ep.responseExample, null, 2)}
                      </pre>
                    </div>

                    {ep.possibleErrors.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">可能异常</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ep.possibleErrors.map((e) => (
                            <span
                              key={e.code}
                              className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs dark:bg-red-950/30"
                            >
                              <code className="font-mono font-medium text-red-600 dark:text-red-400">{e.code}</code>
                              <span className="text-zinc-500 dark:text-zinc-400">{e.message}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="rounded-2xl border-l-4 border-blue-400 bg-blue-50 p-5 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>小贴士：</strong>这份文档一旦定稿，就是前后端联调的唯一标准参考。前端按文档写请求、后端按文档写实现，谁对不上文档谁就是谁的锅。文档先行的意义，就在这里。
          </p>
        </div>
      </main>
    </div>
  );
}
