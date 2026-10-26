import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new ApiError(400, "bad_request", message, details);
export const unauthorized = (message = "Please sign in to continue.") => new ApiError(401, "unauthorized", message);
export const forbidden = (message = "You don't have permission to do that.") => new ApiError(403, "forbidden", message);
export const notFound = (message = "Not found.") => new ApiError(404, "not_found", message);
export const conflict = (message: string) => new ApiError(409, "conflict", message);

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Wrap a route handler with uniform error handling and structured logging. */
export function handler<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) assertSameOrigin(req);
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status },
        );
      }
      console.error(
        JSON.stringify({ level: "error", msg: "unhandled_api_error", path: new URL(req.url).pathname, err: String(err), stack: (err as Error)?.stack }),
      );
      return NextResponse.json(
        { error: { code: "internal_error", message: "Something went wrong. Please try again." } },
        { status: 500 },
      );
    }
  };
}

/** CSRF defence for cookie-authenticated mutations: reject cross-site Origin headers. */
export function assertSameOrigin(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/webhooks/") || url.pathname.startsWith("/api/cron/")) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients; still require a valid session cookie
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origin).host !== host) throw forbidden("Cross-site request blocked.");
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw badRequest(
      result.error.issues[0]?.message ?? "Invalid request.",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  return result.data;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}
