import { authClient } from "../lib/auth-client";

export function useAuth() {
  const session = authClient.useSession();

  return {
    user: session.data?.user ?? null,
    session: session.data?.session ?? null,
    isLoading: session.isPending,
    isAuthenticated: Boolean(session.data?.user),
    refetchSession: session.refetch,
    logout: async () => {
      await authClient.signOut();
      session.refetch();
    },
  };
}
