export * from "./pg-store";

/**
 * Migration helper preserved for backwards compatibility with legacy JSON data.
 */
export function migrateAppDbToDualDialect(rawState: any) {
  return {
    users: (rawState?.users || []).map((u: any) => {
      if (u.email === "admin@sqljudge.com") {
        return { ...u, email: "admin@quro.com" };
      }
      return u;
    }),
    userSettings: rawState?.userSettings || [],
    userQuestionState: (rawState?.userQuestionState || []).map((q: any) => ({
      ...q,
      dialect: q.dialect || "postgresql",
      status: q.status || (q.isSolved ? "solved" : "not_started"),
      attemptCount: q.attemptCount ?? (q.isSolved ? 1 : 0),
      updatedAt: q.updatedAt || new Date().toISOString(),
    })),
    userAttempts: (rawState?.userAttempts || []).map((a: any) => ({
      ...a,
      dialect: a.dialect || "postgresql",
    })),
    xpEvents: (rawState?.xpEvents || []).map((x: any) => ({
      ...x,
      dialect: x.dialect || "postgresql",
    })),
    savedQuestions: (rawState?.savedQuestions || []).map((s: any) => ({
      ...s,
      dialect: s.dialect || "postgresql",
    })),
    queryHistory: (rawState?.queryHistory || []).map((h: any) => ({
      ...h,
      dialect: h.dialect || "postgresql",
    })),
    userDrafts: (rawState?.userDrafts || []).map((d: any) => ({
      ...d,
      dialect: d.dialect || "postgresql",
    })),
  };
}
