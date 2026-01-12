import { useUser, useClerk } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  // We optionally fetch the DB user to match fields, but the primary auth state comes from Clerk
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!isSignedIn && isLoaded,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    await signOut();
    utils.invalidate();
    // Clear local storage hacks from legacy auth
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }, [signOut, utils]);

  return useMemo(() => {
    // Merge Clerk User with DB User (meQuery.data), preferring DB user for role/id
    const dbUser = meQuery.data;

    // Construct a compatible user object
    const finalUser = dbUser ? dbUser : (user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      role: "client", // Default until DB syncs
      hasCompletedOnboarding: 0 // Default
    } : null);

    return {
      user: finalUser as any, // Cast to match expected User type if needed
      loading: !isLoaded || (isSignedIn && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: !!isSignedIn,
      refresh: () => meQuery.refetch(),
      logout,
    };
  }, [user, isLoaded, isSignedIn, meQuery.data, meQuery.isLoading, meQuery.error, logout]);
}
