
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function BottomNav() {
    const [location] = useLocation();
    const totalUnreadCount = useTotalUnreadCount();
    const { navItems } = useBottomNav();
    const [showContextual, setShowContextual] = useState(false);

    const isActive = (p?: string) => {
        if (!p) return false;
        if (p === "/" && location === "/") return true;
        if (p !== "/" && location.startsWith(p)) return true;
        return false;
    };

    const handleDragEnd = (_: any, { offset, velocity }: any) => {
        // Simple threshold to toggle contextual row
        if (offset.y < -30) {
            setShowContextual(true);
        } else if (offset.y > 30) {
            setShowContextual(false);
        }
    };

    return (
        <motion.nav
            className="fixed bottom-0 inset-x-0 z-[50] transition-all duration-300"
            style={{ height: showContextual ? "176px" : "88px" }}
            drag="y"
            dragConstraints={{ top: -80, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
        >
            {showContextual && (
                <div className="flex items-center justify-center bg-slate-950/40 backdrop-blur-[32px] border-t border-white/5 h-[88px]">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Button
                                key={item.id}
                                variant="ghost"
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 h-full w-full rounded-none hover:bg-white/5 transition-all",
                                    "min-w-[33.33vw] w-[33.33vw]",
                                    active ? "text-white" : "text-white/40"
                                )}
                                onClick={item.action}
                            >
                                <item.icon
                                    className={cn(
                                        "w-6 h-6",
                                        active ? "scale-110" : ""
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className={cn("text-[11px] font-medium", active ? "" : "opacity-70")}>{item.label}</span>
                            </Button>
                        );
                    })}
                </div>
            )}
            <div className="w-full h-full overflow-x-auto snap-x snap-mandatory flex items-center no-scrollbar overscroll-x-contain bg-slate-950/40 backdrop-blur-[32px] border-t border-white/5">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const ButtonContent = (
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 h-full w-full rounded-none hover:bg-white/5 transition-all relative snap-center shrink-0",
                                "min-w-[33.33vw] w-[33.33vw]",
                                active ? "text-white" : "text-white/40"
                            )}
                            onClick={item.action}
                        >
                            <div className="relative p-1">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        active
                                            ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                            : "text-white/40 group-hover:text-white/70"
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                {item.id === "messages" && totalUnreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                                        {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                                    </span>
                                )}
                                {item.badgeCount !== undefined && item.badgeCount > 0 && item.id !== "messages" && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                                        {item.badgeCount}
                                    </span>
                                )}
                            </div>
                            <span className={cn("text-[11px] font-medium tracking-wide transition-all duration-300", active ? "text-white opacity-100" : "text-white/40 opacity-70")}>
                                {item.label}
                            </span>
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
        </motion.nav>
    );
}
