import Link from "next/link";
import { CATEGORY_LABELS, ERROR_CODES } from "@/lib/error-codes";
import type { ErrorCodeCategory } from "@/lib/error-codes";

const CATEGORY_ORDER: ErrorCodeCategory[] = ["success", "user", "content", "file", "server"];

const CATEGORY_DESCRIPTIONS: Record<ErrorCodeCategory, string> = {
  success: "请求成功。code 为 0 时代表业务正常完成。",
  user: "用户相关业务错误。用户名重复、密码错误、未登录、无权限等。",
  content: "内容相关业务错误。笔记不存在、重复点赞、评论不存在、分页参数错误等。",
  file: "文件上传相关错误。文件为空、过大、类型不支持。",
  server: "服务器内部错误。兜底分类，正常情况下不应出现。",
};

const HTTP_STATUS_TABLE = [
  { range: "2xx", meaning: "成功", color: "bg-emerald-500", desc: "请求被正确处理。200 OK、201 Created。" },
  { range: "4xx", meaning: "客户端错误", color: "bg-amber-500", desc: "前端请求有问题。400 参数错误、401 未登录、403 无权限、404 找不到、409 冲突。" },
  { range: "5xx", meaning: "服务端错误", color: "bg-red-500", desc: "后端炸了。500 服务器内部错误。" },
];

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
      <Link href="/docs" className="text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400">
        接口文档
      </Link>
      <Link href="/errors" className="font-semibold text-blue-600 dark:text-blue-400">
        错误码表
      </Link>
    </nav>
  );
}

export default function ErrorsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          错误码表
        </h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          HTTP 状态码告诉你「通没通」，业务 code 告诉你「通了的请求内部业务成没成」。两者各司其职。
        </p>

        {/* HTTP 状态码速查 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            <span className="h-5 w-1 rounded bg-blue-600" />
            HTTP 状态码速查
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HTTP_STATUS_TABLE.map((s) => (
              <div
                key={s.range}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className={`${s.color} px-3 py-2 font-mono text-sm font-bold text-white`}>
                  {s.range} · {s.meaning}
                </div>
                <p className="px-3 py-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 业务错误码 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            <span className="h-5 w-1 rounded bg-blue-600" />
            业务错误码
          </h2>

          {CATEGORY_ORDER.map((cat) => {
            const codes = ERROR_CODES.filter((e) => e.category === cat);
            if (codes.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {CATEGORY_DESCRIPTIONS[cat]}
                </p>
                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">常量名</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">含义</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">HTTP 状态码</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {codes.map((e) => (
                        <tr key={e.code} className="text-zinc-700 dark:text-zinc-300">
                          <td className="px-3 py-2">
                            <code className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {e.code}
                            </code>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                            {e.name}
                          </td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{e.message}</td>
                          <td className="px-3 py-2">
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {e.httpStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        {/* 避坑 */}
        <section className="space-y-3">
          <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/30">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>避坑笔记：</strong>别图省事一律返回 200 然后在 body 里塞错误信息——那是糊弄联调的人。
              HTTP 状态码是协议层给的「第一句话」，该 404 就 404、该 401 就 401，前端拦截器按状态码统一处理才靠谱。
            </p>
          </div>
          <div className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50 p-5 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              <strong>小贴士：</strong>建议维护一张错误码表，前缀分类（1xxxx 用户、2xxxx 内容、3xxxx 文件），前端一看到码就知道该弹什么提示。
              统一响应体、统一错误码、统一异常处理这三件套一立，后面不管前端怎么调，你都能稳稳接住。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
