import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type AppRole = "admin" | "accountant" | "viewer";

export type AuthContext = {
  userId: string;
  role: AppRole;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function requireAuth(
  allowedRoles: AppRole[] = ["admin", "accountant", "viewer"]
): Promise<AuthContext> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_INSECURE_LOCAL_DEV === "true" &&
    !process.env.BETTER_AUTH_SECRET
  ) {
    return { userId: "local-development", role: "admin" };
  }

  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user.id) {
    throw new ApiError(401, "Authentication required.");
  }

  const rawRole = session.user.role;
  const role: AppRole =
    rawRole === "admin" || rawRole === "viewer" || rawRole === "accountant"
      ? rawRole
      : "accountant";

  if (!allowedRoles.includes(role)) {
    throw new ApiError(403, "You do not have permission for this action.");
  }

  return { userId: session.user.id, role };
}
