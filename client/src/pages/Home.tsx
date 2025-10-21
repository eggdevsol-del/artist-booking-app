import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Calendar, MessageCircle, Sparkles, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // TEMPORARY: Authentication disabled - no automatic redirect
  // Users can click "Get Started" to enter the app

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">
      {/* Header */}
      <header className="mobile-header px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 rounded-lg" />
            )}
            <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome to {APP_TITLE}
              </h2>
              <p className="text-muted-foreground text-base">
                Connect, book, and manage appointments seamlessly
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-3">
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Real-time Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Instant messaging with clients for bookings and consultations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Smart Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Easy-to-read calendar with week and day views for appointments
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">For Artists & Clients</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tailored experience for both service providers and customers
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Login Button - TEMPORARY: Direct access */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold shadow-lg"
              onClick={() => setLocation("/conversations")}
            >
              Get Started
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No login required - demo mode
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-muted-foreground">
        <p>© 2025 {APP_TITLE}. Beautiful appointments made simple.</p>
      </footer>


    </div>
  );
}

