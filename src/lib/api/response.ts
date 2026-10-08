import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
    },
    { status }
  );
}
