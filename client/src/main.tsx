import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";
import { initializeOneSignal } from "./lib/onesignal";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  // Let Clerk handle redirects or UI states
  // We can just log it for now, or assume the SignedOut component handles the UI
  console.warn("Unauthorized TRPC call", error);
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        // @ts-ignore - Clerk attaches to window
        const token = await window.Clerk?.session?.getToken();
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },
    }),
  ],
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInForceRedirectUrl="/role-selection"
        signUpForceRedirectUrl="/role-selection"
      >
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </trpc.Provider>
);

// Register service worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Initialize OneSignal for push notifications
initializeOneSignal().catch(err => {
  console.error('[OneSignal] Failed to initialize:', err);
});
