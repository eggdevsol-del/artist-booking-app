import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { Brush, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RoleSelection() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const setRoleMutation = trpc.auth.setRole.useMutation();
  const syncUserMutation = trpc.auth.syncUser.useMutation();

  useEffect(() => {
    // Attempt to sync user immediately on mount
    const sync = async () => {
      try {
        await syncUserMutation.mutateAsync();
        setIsSyncing(false);
      } catch (e) {
        console.error("Sync failed", e);
        // Don't block here, let useAuth handle the redirect if still null
        setIsSyncing(false);
      }
    };
    sync();
  }, []);

  useEffect(() => {
    if (loading || isSyncing) return;

    if (!user) {
      // If after loading and syncing we still have no user, go home
      setLocation("/");
    } else if (user.hasCompletedOnboarding) {
      // If user has completed onboarding, they've already chosen their role
      setLocation("/conversations");
    }
  }, [user, loading, isSyncing, setLocation]);

  const handleRoleSelect = async (role: "artist" | "client") => {
    try {
      await setRoleMutation.mutateAsync(role);
      toast.success(`Welcome! You're now registered as ${role === "artist" ? "an artist" : "a client"}`);

      // Show onboarding for clients only
      if (role === "client") {
        setShowOnboarding(true);
      } else {
        setLocation("/conversations");
      }
    } catch (error) {
      console.error("Set Role Error:", error);
      toast.error("Failed to set role. Please try again.");
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setLocation("/complete-profile");
  };

  if (loading || isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Initializing...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingTutorial onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select how you'll be using the app
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4">
          <Card
            className="border-2 border-primary/30 hover:border-primary transition-all cursor-pointer group"
            onClick={() => handleRoleSelect("artist")}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Brush className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">I'm an Artist</CardTitle>
                  <CardDescription className="mt-1">
                    Manage bookings and chat with clients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Set your work hours and services</li>
                <li>• Manage appointments and calendar</li>
                <li>• Customize quick-action buttons</li>
                <li>• Send notifications to clients</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-accent/30 hover:border-accent transition-all cursor-pointer group"
            onClick={() => handleRoleSelect("client")}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">I'm a Client</CardTitle>
                  <CardDescription className="mt-1">
                    Book appointments and chat with artists
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Browse available artists</li>
                <li>• Book and manage appointments</li>
                <li>• Chat about consultations</li>
                <li>• Receive appointment reminders</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {setRoleMutation.isPending && (
          <div className="text-center">
            <Button disabled className="w-full">
              Setting up your account...
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

