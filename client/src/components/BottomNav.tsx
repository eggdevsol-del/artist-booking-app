
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { MessageSquare } from "lucide-react";

export default function BottomNav() {
    const [location] = useLocation();
    const totalUnreadCount = useTotalUnreadCount();
    const { navItems, scope } = useBottomNav(); // Use SSOT nav items

    const isActive = (p?: string) => {
        if (!p) return false;
        if (p === "/" && location === "/") return true;
        if (p !== "/" && location.startsWith(p)) return true;
        return false;
    };

    return (
        <nav className="fixed bottom-0 inset-x-0 z-[50] h-[88px] bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 pb-5">
            <div className="w-full h-full overflow-x-auto snap-x snap-mandatory flex items-center no-scrollbar overscroll-x-contain">
                {/* 
                   Render all items in a single swipeable row.
                   Each item takes exactly 1/3 viewport width to satisfy "3 buttons visible".
                   Snap points ensure centered alignment.
                */}
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    const ButtonContent = (
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 h-full w-full rounded-none hover:bg-white/5 transition-all relative snap-center shrink-0",
                                // Exact 1/3 width to show 3 items
                                "min-w-[33.33vw] w-[33.33vw]"
                            )}
                            onClick={item.action}
                        >
                            <div className="relative p-1">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        active ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/40 group-hover:text-white/70"
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />

                                {/* Messages Unread Badge */}
                                {item.id === "messages" && totalUnreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                                        {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                    </span>
                                )}

                                {/* Generic Badge */}
                                {item.badgeCount !== undefined && item.badgeCount > 0 && item.id !== 'messages' && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                                        {item.badgeCount}
                                    </span>
                                )}
                            </div>

                            <span className={cn(
                                "text-[11px] font-medium tracking-wide transition-all duration-300",
                                active ? "text-white opacity-100" : "text-white/40 opacity-70"
                            )}>
                                {item.label}
                            </span>

                            {/* Active Indicator (Bottom Glow/Line) */}
                            {active && (
                                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
                            )}
                        </Button>
                    );

                    if (item.path) {
                        return (
                            <Link key={item.id} href={item.path} className="contents">
                                {ButtonContent}
                            </Link>
                        );
                    }

                    return (
                        <div key={item.id} className="contents">
                            {ButtonContent}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}

