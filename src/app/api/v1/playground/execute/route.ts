import { NextRequest } from "next/server";
import { z } from "zod";
import { PGlite } from "@electric-sql/pglite";
import { translatePostgresError } from "@/lib/engine/error-translator";
import { errorResponse, successResponse } from "@/lib/api/response";

const PlaygroundSchema = z.object({
  sql: z.string().min(1, "SQL query cannot be empty"),
});

import { getOrCreatePlaygroundDb } from "@/lib/engine/playground-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PlaygroundSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { sql } = parsed.data;

    // Use IP or session identifier
    const sessionId = req.cookies.get("sql_platform_session")?.value || "guest-playground";
    const db = await getOrCreatePlaygroundDb(sessionId);

    const startTime = Date.now();
    try {
      // Execute multi-statement SQL
      const rawRes = await db.query(sql);
      const executionTimeMs = Math.max(1, Date.now() - startTime);

      const rows = (rawRes.rows || []) as Record<string, unknown>[];
      let columns: string[] = [];
      if (rawRes.fields && rawRes.fields.length > 0) {
        columns = rawRes.fields.map((f: any) => f.name);
      } else if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }

      return successResponse({
        result: {
          success: true,
          columns,
          rows: rows.slice(0, 500),
          rowCount: rows.length,
          executionTimeMs,
        },
      });
    } catch (dbErr: any) {
      const executionTimeMs = Math.max(1, Date.now() - startTime);
      const translated = translatePostgresError(dbErr, sql);
      return successResponse({
        result: {
          success: false,
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs,
          error: translated,
        },
      });
    }
  } catch (err: any) {
    return errorResponse("PLAYGROUND_ERROR", err.message || "Playground execution failed", 500);
  }
}
