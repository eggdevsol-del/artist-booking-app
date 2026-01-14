import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";

export default function BottomNav() {
    const [location] = useLocation();
    const totalUnreadCount = useTotalUnreadCount();

    const isActive = (p: string) => {
        if (p === "/" && location === "/") return true;
        if (p !== "/" && location.startsWith(p)) return true;
        return false;
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/conversations", label: "Messages", icon: MessageCircle },
        { path: "/calendar", label: "Calendar", icon: Calendar },
        { path: "/portfolio", label: "Portfolio", icon: Image },
        { path: "/wallet", label: "Wallet", icon: Wallet },
        { path: "/settings", label: "Settings", icon: Settings },
    ];

    return (
        <nav className="fixed bottom-6 inset-x-6 z-50 floating-nav rounded-[2.5rem] pb-0 overflow-hidden">
            <div className="flex items-center px-4 py-3 overflow-x-auto gap-2 no-scrollbar scroll-smooth snap-x">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link key={item.path} href={item.path}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative",
                                    active ? "text-primary scale-105" : "text-muted-foreground opacity-70 hover:opacity-100"
                                )}
                            >
                                <div className="relative">
                                    <item.icon className={cn("w-6 h-6 mb-0.5", active && "fill-current/20")} />
                                    {item.label === "Messages" && totalUnreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-background">
                                            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className={cn("text-[10px] font-medium transition-all", active ? "font-bold" : "font-normal")}>
                                    {item.label}
                                </span>
                                {active && (
                                    <span className="h-1 w-1 rounded-full bg-primary absolute bottom-1" />
                                )}
                            </Button>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}
