import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, MessageCircle, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
    const [location] = useLocation();

    const isActive = (path: string) => location === path;

    return (
        <nav className="mobile-bottom-nav">
            <div className="flex items-center justify-around px-4 py-3">
                <Link href="/conversations">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-col h-auto py-2 gap-1 hover:bg-transparent",
                            isActive("/conversations") ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-xs font-medium">Messages</span>
                    </Button>
                </Link>

                <Link href="/calendar">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-col h-auto py-2 gap-1 hover:bg-transparent",
                            isActive("/calendar") ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Calendar className="w-6 h-6" />
                        <span className="text-xs font-medium">Calendar</span>
                    </Button>
                </Link>

                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-col h-auto py-2 gap-1 hover:bg-transparent",
                            isActive("/settings") ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Settings className="w-6 h-6" />
                        <span className="text-xs font-medium">Settings</span>
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
