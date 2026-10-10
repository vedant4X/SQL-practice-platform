import { describe, it, expect, beforeEach } from "vitest";
import { appStore } from "../../src/lib/db/store";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { createSessionToken } from "../../src/lib/auth/session";

describe("Admin Console & Credentials Management Suite", () => {
  beforeEach(() => {
    appStore.resetForTesting();
  });

  it("seeds and retrieves administrator account properly", async () => {
    appStore.ensureDefaultAdmin();

    const admin = appStore.getUserByEmail("admin@sqljudge.com");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("admin");
    expect(admin?.passwordPlain).toBe("admin123");

    const isValid = await verifyPassword("admin123", admin!.passwordHash);
    expect(isValid).toBe(true);
  });

  it("stores passwordPlain on user registration for admin console inspection", async () => {
    const rawPass = "StudentSecretPass789!";
    const hashed = await hashPassword(rawPass);

    const user = appStore.createUser({
      id: "usr-student-1",
      email: "student@university.edu",
      passwordHash: hashed,
      passwordPlain: rawPass,
      name: "Student Jane",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const stored = appStore.getUserById(user.id);
    expect(stored?.passwordPlain).toBe(rawPass);
    expect(stored?.passwordHash).toBe(hashed);
    expect(stored?.role).toBe("user");
  });

  it("allows administrators to reset and update user passwords and roles", async () => {
    appStore.ensureDefaultAdmin();

    const user = appStore.createUser({
      id: "usr-learner-42",
      email: "learner@sql.org",
      passwordHash: "old-hash",
      passwordPlain: "oldpass",
      name: "Learner Bob",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Reset password
    const newPass = "NewSecurePassword456!";
    const newHash = await hashPassword(newPass);

    const updated = appStore.updateUser(user.id, {
      passwordHash: newHash,
      passwordPlain: newPass,
      role: "admin",
    });

    expect(updated?.passwordPlain).toBe(newPass);
    expect(updated?.role).toBe("admin");

    const validNew = await verifyPassword(newPass, updated!.passwordHash);
    expect(validNew).toBe(true);

    // Verify retrieval
    const fetched = appStore.getUserById(user.id);
    expect(fetched?.passwordPlain).toBe(newPass);
    expect(fetched?.role).toBe("admin");
  });

  it("deletes user and cleans up cascading records", () => {
    const user = appStore.createUser({
      id: "usr-to-delete",
      email: "delete-me@test.com",
      passwordHash: "hash",
      name: "Ephemeral User",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(appStore.getUserById("usr-to-delete")).toBeDefined();

    const success = appStore.deleteUser("usr-to-delete");
    expect(success).toBe(true);
    expect(appStore.getUserById("usr-to-delete")).toBeUndefined();
    expect(appStore.getUserByEmail("delete-me@test.com")).toBeUndefined();
  });
});
