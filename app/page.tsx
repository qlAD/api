import Link from "next/link";

const ENTRY_CARDS = [
  {
    href: "/range",
    title: "调试台",
    desc: "左侧接口树 + 右侧请求发送器，浏览器里直接发请求看真实响应。支持快速登录、自动带 token。",
    accent: "from-blue-500 to-indigo-600",
    badge: "核心",
  },
  {
    href: "/docs",
    title: "接口文档",
    desc: "按模块分节的全套接口文档：地址、方法、入参、返回体、权限、异常。含 RESTful 规范与跨域说明。",
    accent: "from-emerald-500 to-teal-600",
    badge: "规范",
  },
  {
    href: "/errors",
    title: "错误码表",
    desc: "业务错误码按前缀分类（1xxxx 用户 / 2xxxx 内容 / 3xxxx 文件），附 HTTP 状态码语义速查。",
    accent: "from-amber-500 to-orange-600",
    badge: "速查",
  },
  {
    href: "/docs#specification",
    title: "规范与跨域",
    desc: "统一响应体三字段、RESTful 方法与资源路径分离、URL 命名风格，以及 SpringBoot 跨域配置思路。",
    accent: "from-rose-500 to-pink-600",
    badge: "避坑",
  },
];

const KNOWLEDGE_POINTS = [
  "RESTful 约定：GET / POST / PUT / DELETE 各司其职",
  "统一响应体：{ code, message, data } 三字段",
  "业务错误码：前缀分类，前端一看码就知道该弹啥",
  "全局异常处理：把异常收进统一响应体",
  "my-liked-notes：点赞表反查，零成本复用",
  "文件上传：拿 URL 再随笔记存",
];

const DEMO_FLOW = [
  "注册 → 登录拿 token → 勾选自动带 token",
  "发笔记（带 images）→ 列表 → 详情 → 更新",
  "点赞 → 发评论 → 收藏",
  "my-liked-notes → my-favorites",
  "删评论 → 取消点赞 → 取消收藏 → 删笔记",
  "异常场景：重复注册 / 错误密码 / 未登录 / 重复点赞",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Hero */}
        <section className="mb-10">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">Day 07</span>
            <span>当后厨开出了第一份正经菜单</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            RESTful API 靶场
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            社区项目全套接口的在线调试环境。把后端从「能跑」变成「能用」——发笔记、刷首页、点赞、评论、收藏、传图、登录注册，每个动作背后都有一个能响应的真实接口。
          </p>
        </section>

        {/* 知识点 */}
        <section className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            这个靶场演示什么
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KNOWLEDGE_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="mt-1 text-emerald-500">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 入口卡片 */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            开始
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ENTRY_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{card.title}</h3>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {card.badge}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{card.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                  进入
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 演示顺序 */}
        <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">建议演示顺序</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            教学演示时按这条链路走，能一次跑通社区核心闭环。
          </p>
          <ol className="space-y-2">
            {DEMO_FLOW.map((step, idx) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {idx + 1}
                </span>
                <span className="pt-0.5 font-mono text-zinc-700 dark:text-zinc-300">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 避坑提示 */}
        <section className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>避坑笔记：</strong>别图省事一律返回 200 然后在 body 里塞错误信息。HTTP 状态码告诉前端「通没通」，业务 code 告诉前端「通了的请求内部业务成没成」，两者各司其职。靶场里每个错误响应都配套了正确的状态码，留意响应头的 HTTP status。
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
        Next.js 16 Route Handlers · 内存存储 · 教学演示用 · 重启数据重置
      </footer>
    </div>
  );
}
