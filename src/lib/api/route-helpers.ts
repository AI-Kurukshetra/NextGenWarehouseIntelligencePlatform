import { fail } from "@/lib/api/responses";

type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

export function withErrorHandling(handler: RouteHandler) {
  return async (request: Request, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected server error";

      return fail(message, 500);
    }
  };
}

export async function readJson<T>(request: Request): Promise<T> {
  const text = await request.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export function parsePagination(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "25");
  const offset = Number(searchParams.get("offset") ?? "0");

  return {
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 25,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
    query: searchParams.get("q")?.trim() ?? "",
  };
}

export async function getRouteParam(context: RouteContext, key: string) {
  const params = await context.params;
  const raw = params?.[key];

  if (typeof raw !== "string" || !raw) {
    throw new Error(`Missing route parameter: ${key}`);
  }

  return raw;
}

export function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  const blockedKeys = new Set(["id", "created_at", "updated_at"]);

  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => !blockedKeys.has(key) && value !== undefined),
  );
}
