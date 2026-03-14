import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RouteContext = {
  params: Promise<unknown>;
};

type RouteHandler<TContext extends RouteContext = RouteContext> = (
  request: Request,
  context: TContext,
) => Promise<Response>;

export function jsonSuccess(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: { message, details },
    },
    { status },
  );
}

export function handleRoute<TContext extends RouteContext = RouteContext>(handler: RouteHandler<TContext>) {
  return async (request: Request, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return jsonError(error.status, error.message, error.details);
      }

      if (error instanceof ZodError) {
        return jsonError(400, "Validation failed.", error.flatten());
      }

      if (error instanceof Error) {
        return jsonError(500, error.message);
      }

      return jsonError(500, "Unexpected server error.");
    }
  };
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }

  return schema.parse(payload);
}

export function parseQuery<T>(request: Request, schema: ZodType<T>) {
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  return schema.parse(query);
}

export async function parseParams<T>(context: RouteContext, schema: ZodType<T>) {
  const params = await context.params;
  return schema.parse(params);
}