import { fail } from "./response";
import { ERR_INTERNAL, ERR_PARAM, findErrorCode } from "./error-codes";

// 业务异常：携带业务 code 与 HTTP 状态映射
export class ApiError extends Error {
  code: number;
  httpStatus?: number;

  constructor(code: number, message?: string, httpStatus?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// 模拟 SpringBoot 全局异常处理器：统一 try/catch，把异常收进统一响应体
// 用 rest 参数适配有无动态参数两种 handler 签名
export function withErrorHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ApiError) {
        const entry = findErrorCode(e.code);
        return fail(e.code, e.message || entry?.message, e.httpStatus);
      }
      // 参数校验类（JSON 解析失败、类型转换失败）兜成 10001
      if (e instanceof SyntaxError || e instanceof TypeError) {
        return fail(ERR_PARAM, e.message || "参数解析失败");
      }
      // 其余视为服务器内部错误
      console.error("[range] unhandled error:", e);
      return fail(ERR_INTERNAL, "服务器内部错误");
    }
  };
}

// 分页参数校验辅助
export function parsePagination(searchParams: URLSearchParams): { page: number; size: number } {
  const page = Number(searchParams.get("page") ?? "1");
  const size = Number(searchParams.get("size") ?? "10");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100) {
    throw new ApiError(ERR_PARAM, "分页参数错误（page/size 需为正整数，size 最大 100）");
  }
  return { page, size };
}

// 路径参数 id 解析
export function parseId(raw: string | string[] | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new ApiError(ERR_PARAM, "id 需为正整数");
  }
  return n;
}
