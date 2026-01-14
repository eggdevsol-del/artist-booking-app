import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";
import { BottomNavRow } from "./BottomNavRow";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { motion, PanInfo } from "framer-motion";
import { useState } from "react";

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

    const { rowIndex, isContextualVisible, setContextualVisible, contextualRow } = useBottomNav();
    const [dragY, setDragY] = useState(0);

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 50; // Drag threshold to trigger switch
        if (info.offset.y < -threshold && rowIndex === 0 && contextualRow) {
            // Swipe UP
            setContextualVisible(true);
        } else if (info.offset.y > threshold && rowIndex === 1) {
            // Swipe DOWN
            setContextualVisible(false);
        }
    };

    return (
        <nav className="fixed bottom-6 inset-x-6 z-50 floating-nav rounded-[2.5rem] bg-none pb-0 overflow-hidden h-[68px]">
            {/* Background blur/color is typically on the nav itself or the row. 
                Existing Button styling suggests the nav container has background. 
                Checking original code: 'floating-nav' likely handles bg. 
                Original: <nav className="... floating-nav ...">
             */}

            <motion.div
                className="flex flex-col h-full relative"
                animate={{ y: rowIndex === 0 ? "0%" : "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y"
                dragConstraints={{ top: rowIndex === 1 ? 0 : 0, bottom: rowIndex === 0 ? 0 : 0 }} // Lock drag unless we want visual feedback
                dragElastic={0.2} // Allow some stretch
                onDragEnd={handleDragEnd}
                // Lock horizontal drag to allow scrolling inside the row
                dragDirectionLock
                // Only allow drag if we have a contextual row or are already showing it
                dragListener={!!contextualRow}
            >
                {/* Row 0: Main Nav */}
                <div className="h-full shrink-0">
                    <BottomNavRow>
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
                    </BottomNavRow>
                </div>

                {/* Row 1: Contextual Row (if exists) */}
                {contextualRow && (
                    <div className="h-full shrink-0">
                        {contextualRow}
                    </div>
                )}
            </motion.div>
        </nav>
    );
}
