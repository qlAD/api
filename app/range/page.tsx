"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_ENDPOINTS, MODULE_LABELS, endpointsByModule } from "@/lib/api-spec";
import type { ApiEndpoint, ApiModule, HttpMethod } from "@/lib/types";

interface ResponseState {
  status: number;
  statusText: string;
  body: unknown;
  duration: number;
}

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  DELETE: "method-delete",
};

function buildInitialBody(ep: ApiEndpoint): string {
  const bodyParams = ep.params.filter((p) => p.location === "body" && p.type !== "file");
  if (bodyParams.length === 0) return "";
  const obj: Record<string, unknown> = {};
  for (const p of bodyParams) {
    if (p.example !== undefined && p.example !== "(选择文件)") {
      try {
        obj[p.name] = JSON.parse(p.example);
      } catch {
        obj[p.name] = p.example;
      }
    }
  }
  return JSON.stringify(obj, null, 2);
}

function buildInitialParams(ep: ApiEndpoint, location: "path" | "query"): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const p of ep.params) {
    if (p.location === location) obj[p.name] = p.example ?? "";
  }
  return obj;
}

function syntaxHighlight(json: unknown): string {
  let jsonStr: string;
  try {
    jsonStr = JSON.stringify(json, null, 2);
  } catch {
    jsonStr = String(json);
  }
  if (jsonStr === undefined) return "";
  return jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      },
    );
}

function statusColor(status: number): string {
  if (status === 0) return "bg-gray-500";
  if (status < 300) return "bg-emerald-500";
  if (status < 400) return "bg-blue-500";
  if (status < 500) return "bg-amber-500";
  return "bg-red-500";
}

function MethodBadge({ method }: { method: HttpMethod }) {
  return <span className={`method-badge ${METHOD_CLASS[method]}`}>{method}</span>;
}

export default function RangePage() {
  const grouped = useMemo(() => endpointsByModule(), []);
  const moduleOrder: ApiModule[] = ["user", "note", "interaction", "file", "admin"];

  const [selectedId, setSelectedId] = useState<string>(API_ENDPOINTS[0].id);
  const current = useMemo(
    () => API_ENDPOINTS.find((e) => e.id === selectedId) ?? API_ENDPOINTS[0],
    [selectedId],
  );

  const [token, setToken] = useState<string>("");
  const [autoToken, setAutoToken] = useState<boolean>(true);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string>("");

  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 初始化 token（localStorage）：挂载时从外部存储读取初始值
  useEffect(() => {
    const saved = localStorage.getItem("range_token");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  function selectEndpoint(id: string) {
    const ep = API_ENDPOINTS.find((e) => e.id === id) ?? API_ENDPOINTS[0];
    setSelectedId(id);
    setPathParams(buildInitialParams(ep, "path"));
    setQueryParams(buildInitialParams(ep, "query"));
    setBodyText(buildInitialBody(ep));
    setFile(null);
    setResponse(null);
    setError("");
  }

  async function quickLogin(username: string) {
    setLoginLoading(true);
    setLoginMsg("");
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: "123456" }),
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.token) {
        const t = json.data.token as string;
        setToken(t);
        setTokenInput(t);
        localStorage.setItem("range_token", t);
        setLoginMsg(`已登录：${json.data.user.nickname}`);
      } else {
        setLoginMsg(`登录失败：${json.message}`);
      }
    } catch {
      setLoginMsg("登录请求失败");
    } finally {
      setLoginLoading(false);
    }
  }

  function clearToken() {
    setToken("");
    setTokenInput("");
    setLoginMsg("已清除 token");
    localStorage.removeItem("range_token");
  }

  function applyTokenInput() {
    setToken(tokenInput.trim());
    localStorage.setItem("range_token", tokenInput.trim());
    setLoginMsg(tokenInput.trim() ? "已保存 token" : "已清除 token");
  }

  async function resetData() {
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const json = await res.json();
      setLoginMsg(json.message ?? "已重置");
    } catch {
      setLoginMsg("重置失败");
    }
  }

  async function sendRequest() {
    setError("");
    setResponse(null);
    setLoading(true);

    let path = current.path;
    for (const [k, v] of Object.entries(pathParams)) {
      path = path.replace(`[${k}]`, encodeURIComponent(v || "0"));
    }
    const url = new URL(path, window.location.origin);
    for (const [k, v] of Object.entries(queryParams)) {
      if (v) url.searchParams.set(k, v);
    }

    const headers: Record<string, string> = {};
    if (autoToken && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const init: RequestInit = { method: current.method, headers };

    if (current.method !== "GET" && current.method !== "DELETE") {
      if (current.id === "upload") {
        const formData = new FormData();
        if (file) formData.append("file", file);
        init.body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        if (bodyText.trim()) {
          init.body = bodyText;
        }
      }
    }

    const start = performance.now();
    try {
      const res = await fetch(url.toString(), init);
      const duration = Math.round(performance.now() - start);
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        // 保留纯文本
      }
      setResponse({ status: res.status, statusText: res.statusText, body, duration });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const pathParamList = current.params.filter((p) => p.location === "path");
  const queryParamList = current.params.filter((p) => p.location === "query");
  const bodyParamList = current.params.filter((p) => p.location === "body");
  const isFileUpload = current.id === "upload";

  return (
    <div className="flex h-screen flex-col">
      {/* 顶部工具条 */}
      <header className="flex flex-none flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← 首页
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">调试台</h1>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => quickLogin("teacher")}
            disabled={loginLoading}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            快速登录讲师
          </button>
          <button
            onClick={() => quickLogin("alice")}
            disabled={loginLoading}
            className="rounded-md bg-zinc-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            登录爱丽丝
          </button>
          <button
            onClick={resetData}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            重置数据
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={autoToken}
              onChange={(e) => setAutoToken(e.target.checked)}
              className="accent-blue-600"
            />
            自动带 token
          </label>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="粘贴 token..."
            className="w-56 rounded-md border border-zinc-300 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <button
            onClick={applyTokenInput}
            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            保存
          </button>
          <button
            onClick={clearToken}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            清除
          </button>
        </div>

        {loginMsg && (
          <div className="w-full text-xs text-zinc-500 dark:text-zinc-400">{loginMsg}</div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧接口树 */}
        <aside className="scroll-thin w-64 flex-none overflow-y-auto border-r border-zinc-200 bg-zinc-50 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          {moduleOrder.map((mod) => {
            const eps = grouped[mod];
            if (eps.length === 0) return null;
            return (
              <div key={mod} className="mb-3">
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {MODULE_LABELS[mod]}
                </div>
                <ul>
                  {eps.map((ep) => (
                    <li key={ep.id}>
                      <button
                        onClick={() => selectEndpoint(ep.id)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                          selectedId === ep.id
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <MethodBadge method={ep.method} />
                        <span className="truncate font-mono">{ep.path.replace("/api", "")}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </aside>

        {/* 右侧主区：详情 + 调试器 */}
        <main className="flex flex-1 overflow-hidden">
          {/* 接口详情 */}
          <section className="scroll-thin w-2/5 flex-none overflow-y-auto border-r border-zinc-200 p-5 dark:border-zinc-800">
            <div className="mb-3 flex items-center gap-2">
              <MethodBadge method={current.method} />
              <code className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                {current.path}
              </code>
            </div>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {current.title}
            </h2>
            <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {current.description}
            </p>

            <div className="mb-4 flex items-center gap-2 text-xs">
              <span className="text-zinc-500">权限：</span>
              {current.authRequired ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  需登录
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  无需登录
                </span>
              )}
            </div>

            {/* 入参表 */}
            {current.params.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  入参
                </h3>
                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
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
                      {current.params.map((p) => (
                        <tr key={p.name} className="text-zinc-700 dark:text-zinc-300">
                          <td className="px-2 py-1.5 font-mono">{p.name}</td>
                          <td className="px-2 py-1.5 font-mono text-blue-600 dark:text-blue-400">{p.type}</td>
                          <td className="px-2 py-1.5">{p.location}</td>
                          <td className="px-2 py-1.5">
                            {p.required ? (
                              <span className="text-red-500">是</span>
                            ) : (
                              <span className="text-zinc-400">否</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-zinc-500">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 返回体示例 */}
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                返回体示例
              </h3>
              <pre
                className="scroll-thin overflow-x-auto rounded-lg bg-zinc-900 p-3 text-zinc-100 dark:bg-zinc-950"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(current.responseExample) }}
              />
            </div>

            {/* 可能异常 */}
            {current.possibleErrors.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  可能异常
                </h3>
                <ul className="space-y-1">
                  {current.possibleErrors.map((e) => (
                    <li key={e.code} className="flex items-center gap-2 text-xs">
                      <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        {e.code}
                      </code>
                      <span className="text-zinc-600 dark:text-zinc-400">{e.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 调试器 */}
          <section className="scroll-thin flex-1 overflow-y-auto p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              请求调试
            </h3>

            {/* path 参数 */}
            {pathParamList.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">路径参数</div>
                <div className="grid grid-cols-2 gap-2">
                  {pathParamList.map((p) => (
                    <div key={p.name}>
                      <label className="mb-0.5 block text-xs text-zinc-500">
                        {p.name}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pathParams[p.name] ?? ""}
                        onChange={(e) => setPathParams({ ...pathParams, [p.name]: e.target.value })}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* query 参数 */}
            {queryParamList.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">查询参数</div>
                <div className="grid grid-cols-2 gap-2">
                  {queryParamList.map((p) => (
                    <div key={p.name}>
                      <label className="mb-0.5 block text-xs text-zinc-500">
                        {p.name}
                        {p.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={queryParams[p.name] ?? ""}
                        onChange={(e) => setQueryParams({ ...queryParams, [p.name]: e.target.value })}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* body */}
            {isFileUpload ? (
              <div className="mb-4">
                <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  请求体（multipart/form-data，字段名 file）
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-blue-700 dark:text-zinc-400"
                />
                {file && (
                  <div className="mt-1 text-xs text-zinc-500">
                    {file.name}（{(file.size / 1024).toFixed(1)} KB，{file.type}）
                  </div>
                )}
              </div>
            ) : (
              bodyParamList.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    请求体（JSON）
                  </div>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={10}
                    className="scroll-thin w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    spellCheck={false}
                  />
                </div>
              )
            )}

            {/* 发送按钮 */}
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={sendRequest}
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "发送中…" : "发送请求"}
              </button>
              {autoToken && token ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  将携带 token
                </span>
              ) : autoToken && !token ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  未设置 token（需登录接口将返回 10005）
                </span>
              ) : (
                <span className="text-xs text-zinc-400">不带 token</span>
              )}
            </div>

            {/* 响应 */}
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                请求失败：{error}
              </div>
            )}

            {response && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">响应：</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono font-semibold text-white ${statusColor(response.status)}`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-zinc-400">{response.duration} ms</span>
                </div>
                <pre
                  className="scroll-thin overflow-x-auto rounded-lg bg-zinc-900 p-3 text-zinc-100 dark:bg-zinc-950"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.body) }}
                />
              </div>
            )}

            {!response && !error && !loading && (
              <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
                填好参数，点「发送请求」看响应。
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
