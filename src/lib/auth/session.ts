import { cookies, headers } from "next/headers";
import { getUserById, getUserByEmail, createUser, DEMO_USER } from "../db/repository";
import { UserRecord } from "../db/types";
import { auth } from "@/lib/auth";

export const SESSION_COOKIE_NAME = "rs_session_token";

export async function getCurrentUser(): Promise<UserRecord | null> {
  try {
    const resolvedHeaders = await headers();

    // 1. Check Better Auth verified session
    try {
      const authSession = await auth.api.getSession({
        headers: resolvedHeaders,
      });

      if (authSession?.user) {
        return {
          id: authSession.user.id,
          email: authSession.user.email,
          name: authSession.user.name || authSession.user.email.split("@")[0],
          image:
            authSession.user.image ||
            (authSession.user.email?.toLowerCase().includes("urvil") ||
            authSession.user.name?.toLowerCase().includes("urvil")
              ? "https://github.com/uvpatel.png"
              : undefined),
          createdAt: authSession.user.createdAt
            ? new Date(authSession.user.createdAt).toISOString()
            : new Date().toISOString(),
        };
      }
    } catch {
      // Continue to header/cookie check
    }

    // 2. Check test / header override
    const testUserId = resolvedHeaders.get("x-user-id");
    if (testUserId && testUserId.trim().length > 0) {
      return {
        id: testUserId.trim(),
        email: `${testUserId.trim()}@example.com`,
        name: testUserId.trim(),
        image:
          testUserId.trim().toLowerCase().includes("urvil")
            ? "https://github.com/uvpatel.png"
            : undefined,
        createdAt: new Date().toISOString(),
      };
    }

    // 3. Check session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get("better-auth.session_token")?.value;

    if (token) {
      if (token.startsWith("usr_")) {
        const user = await getUserById(token);
        if (user) return user;
        return {
          id: token,
          email: `${token}@example.com`,
          name: token,
          createdAt: new Date().toISOString(),
        };
      }
      if (token.includes("@")) {
        const user = await getUserByEmail(token);
        if (user) return user;
      }
    }

    // In automated tests or development without credentials, provide demo user if query flag is passed
    if (process.env.NODE_ENV === "test") {
      return DEMO_USER;
    }

    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<UserRecord> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function setSessionUser(user: UserRecord): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("better-auth.session_token");
}

export async function loginWithEmail(email: string): Promise<UserRecord> {
  let user = await getUserByEmail(email);
  if (!user) {
    user = await createUser(email);
  }
  await setSessionUser(user);
  return user;
}
