import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Redirect } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">

      {/* If signed in, go straight to role selection (which handles onboarding checks) */}
      <SignedIn>
        <Redirect to="/role-selection" />
      </SignedIn>

      {/* If signed out, show the Login card */}
      <SignedOut>
        <div className="w-full max-w-md px-4 py-8 space-y-8 animate-in fade-in zoom-in duration-500">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent shadow-xl mb-4">
              {APP_LOGO ? (
                <img src={APP_LOGO} alt={APP_TITLE} className="w-16 h-16 object-contain" />
              ) : (
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                {APP_TITLE}
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Beautiful appointments made simple
              </p>
            </div>
          </div>

          {/* Clerk Sign In Component - Embeds the login form directly or redirects */}
          {/* We use RedirectToSignIn to just force the Clerk Modal/Page immediately */}
          <div className="flex justify-center">
            {/* This redirects to Clerk hosted login page immediately */}
            <RedirectToSignIn afterSignInUrl="/role-selection" />
          </div>
        </div>
      </SignedOut>
    </div>
  );
}

