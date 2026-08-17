import { httpStatusFor, OK } from "./error-codes";
import type { ApiResponse } from "./types";

function json(body: ApiResponse, status: number): Response {
  return Response.json(body, { status });
}

export function ok<T>(data: T, message = "success"): Response {
  return json({ code: OK, message, data }, 200);
}

export function created<T>(data: T, message = "created"): Response {
  return json({ code: OK, message, data }, 201);
}

export function fail(code: number, message?: string, httpStatus?: number): Response {
  const status = httpStatus ?? httpStatusFor(code);
  return json({ code, message: message ?? "error", data: null }, status);
}
