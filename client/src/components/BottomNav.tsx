import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Settings, Image as ImageIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function BottomNav() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Don't show on auth pages
  if (location === "/login" || location === "/signup" || location === "/role-selection" || location === "/complete-profile" || location === "/" || location === "/404") {
    return null;
  }

  // Don't show while loading to prevent errors
  if (loading || !user) {
    return null;
  }

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-center justify-around px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-col h-auto py-2 gap-1 ${isActive("/conversations") || isActive("/chat") ? "text-primary" : ""}`}
          onClick={() => setLocation("/conversations")}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Messages</span>
        </Button>

        {user?.role === "client" && (
          <Button
            variant="ghost"
            size="sm"
            className={`flex-col h-auto py-2 gap-1 ${isActive("/content") ? "text-primary" : ""}`}
            onClick={() => setLocation("/content")}
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Content</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={`flex-col h-auto py-2 gap-1 ${isActive("/calendar") ? "text-primary" : ""}`}
          onClick={() => setLocation("/calendar")}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium">Calendar</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex-col h-auto py-2 gap-1 ${isActive("/settings") ? "text-primary" : ""}`}
          onClick={() => setLocation("/settings")}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </Button>
      </div>
    </nav>
  );
}

