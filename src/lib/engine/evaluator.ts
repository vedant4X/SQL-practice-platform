import { compareResults } from "./result-comparator";
import { getDialectAdapter } from "./adapters";
import { QuestionMetadata, SubmissionEvaluationResult, TestCaseResult } from "./types";

interface CachedSolution {
  columns: string[];
  rows: Record<string, unknown>[];
}

const solutionResultCache = new Map<string, CachedSolution>();

export function clearSolutionResultCache(): void {
  solutionResultCache.clear();
}

/**
 * Evaluates a user submission against all visible and hidden test cases for any dialect
 */
export async function evaluateSubmission(
  question: QuestionMetadata,
  userQuery: string
): Promise<SubmissionEvaluationResult> {
  const adapter = getDialectAdapter(question.dialect || "postgresql");
  const testCaseResults: TestCaseResult[] = [];
  let passedCount = 0;
  let overallExecutionTimeMs = 0;

  for (const testCase of question.test_cases) {
    const variant: "sample" | "hidden_1" | "hidden_2" =
      testCase.dataset_name === "hidden_2"
        ? "hidden_2"
        : testCase.dataset_name === "hidden_1"
        ? "hidden_1"
        : "sample";

    // 1. Execute User SQL Query via dialect adapter
    const userRes = await adapter.execute({
      databaseId: question.database_id,
      query: userQuery,
      variant,
      options: {
        questionType: question.question_type,
        availableTables: question.tables_involved,
      },
    });

    overallExecutionTimeMs += userRes.executionTimeMs;

    if (!userRes.success) {
      testCaseResults.push({
        testCaseId: testCase.id,
        name: testCase.name,
        isHidden: testCase.is_hidden,
        passed: false,
        executionTimeMs: userRes.executionTimeMs,
        error: userRes.error?.userFacingMessage || "Execution failed.",
        // For visible test case only, show partial debug info
        columns: testCase.is_hidden ? undefined : userRes.columns,
        userRows: testCase.is_hidden ? undefined : userRes.rows,
      });

      return {
        verdict:
          userRes.error?.code === "57014" || userRes.error?.code === "3024"
            ? "timeout"
            : "error",
        passedCount,
        totalCount: question.test_cases.length,
        testCaseResults,
        overallExecutionTimeMs,
        error: userRes.error?.userFacingMessage,
      };
    }

    // 2. Fetch or Execute Reference Solution Query
    const cacheKey = `${question.id}:${question.version || 1}:${variant}`;
    let solutionData = solutionResultCache.get(cacheKey);

    if (!solutionData) {
      const solutionRes = await adapter.execute({
        databaseId: question.database_id,
        query: question.solution_query,
        variant,
        options: {
          questionType: question.question_type,
          availableTables: question.tables_involved,
        },
      });

      if (!solutionRes.success) {
        throw new Error(
          `Critical: Stored solution query failed on test case '${testCase.name}': ${solutionRes.error?.message}`
        );
      }

      solutionData = {
        columns: solutionRes.columns,
        rows: solutionRes.rows,
      };
      solutionResultCache.set(cacheKey, solutionData);
    }

    // 3. Compare Results
    const comparison = compareResults(
      userRes.rows,
      userRes.columns,
      solutionData.rows,
      solutionData.columns,
      {
        ...question.comparison_config,
        order_matters: question.order_matters,
      }
    );

    if (comparison.passed) {
      passedCount++;
      testCaseResults.push({
        testCaseId: testCase.id,
        name: testCase.name,
        isHidden: testCase.is_hidden,
        passed: true,
        executionTimeMs: userRes.executionTimeMs,
        columns: testCase.is_hidden ? undefined : userRes.columns,
        userRows: testCase.is_hidden ? undefined : userRes.rows,
        expectedRows: testCase.is_hidden ? undefined : solutionData.rows,
      });
    } else {
      testCaseResults.push({
        testCaseId: testCase.id,
        name: testCase.name,
        isHidden: testCase.is_hidden,
        passed: false,
        executionTimeMs: userRes.executionTimeMs,
        feedback: comparison.feedback,
        columns: testCase.is_hidden ? undefined : userRes.columns,
        userRows: testCase.is_hidden ? undefined : userRes.rows,
        expectedRows: testCase.is_hidden ? undefined : solutionData.rows,
      });
    }
  }

  return {
    verdict: passedCount === question.test_cases.length ? "correct" : "incorrect",
    passedCount,
    totalCount: question.test_cases.length,
    testCaseResults,
    overallExecutionTimeMs,
  };
}
