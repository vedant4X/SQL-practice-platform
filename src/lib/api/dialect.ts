import { Dialect } from "../engine/types";
import { isValidDialect } from "../engine/adapters";
import { errorResponse } from "./response";

export function parseDialect(
  dialectParam: string
): { dialect: Dialect } | { error: ReturnType<typeof errorResponse> } {
  if (!isValidDialect(dialectParam)) {
    return {
      error: errorResponse(
        "INVALID_DIALECT",
        `Invalid SQL dialect: '${dialectParam}'. Supported dialects are 'postgresql' and 'mysql'.`,
        400
      ),
    };
  }
  return { dialect: dialectParam };
}
