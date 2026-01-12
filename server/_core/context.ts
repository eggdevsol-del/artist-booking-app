import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";

// Ensure key is present or log warning (it might be missing in build step)
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("Missing CLERK_SECRET_KEY");
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      // Cast req to any to bypass strict type check
      const requestState = await clerk.authenticateRequest(opts.req as any, {
        jwtKey: process.env.CLERK_JWT_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (requestState.isSignedIn) {
        const authObj = requestState.toAuth();
        const clerkUserId = (authObj as any).userId;

        if (clerkUserId) {
          const database = await getDb();

          if (database) {
            // Use select().from() since schema might not be loaded in drizzle instance
            const [existingUser] = await database.select().from(users).where(eq(users.clerkId, clerkUserId));

            if (existingUser) {
              user = existingUser;
            } else {
              const clerkUser = await clerk.users.getUser(clerkUserId);
              const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

              if (primaryEmail) {
                const [userByEmail] = await database.select().from(users).where(eq(users.email, primaryEmail));

                if (userByEmail) {
                  await database.update(users).set({ clerkId: clerkUserId }).where(eq(users.id, userByEmail.id));
                  user = { ...userByEmail, clerkId: clerkUserId };
                } else {
                  const newUser = {
                    id: clerkUserId,
                    clerkId: clerkUserId,
                    email: primaryEmail,
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "New User",
                    role: "client" as const,
                    loginMethod: "clerk",
                    hasCompletedOnboarding: false
                  };

                  await database.insert(users).values(newUser);
                  // Simple return of created user since we know values
                  user = newUser as User;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Auth Error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
