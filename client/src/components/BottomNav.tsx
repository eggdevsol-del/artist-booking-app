
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";
import { BottomNavRow } from "./BottomNavRow";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

const ROW_HEIGHT = 68; // px

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

    // Gesture State
    const controls = useAnimation();
    const y = useMotionValue(0);
    const mainRowRef = useRef<HTMLDivElement>(null);
    const axisLocked = useRef<'x' | 'y' | null>(null);

    // Sync animation with state changes
    useEffect(() => {
        controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
    }, [isContextualVisible, controls]);

    const handlePanStart = () => {
        axisLocked.current = null;
    };

    const handlePan = (event: any, info: any) => {
        const { offset, delta } = info;
        const absX = Math.abs(offset.x);
        const absY = Math.abs(offset.y);

        // Axis Locking Logic
        if (!axisLocked.current) {
            if (absX > 10 || absY > 10) { // Threshold ~10-12px
                if (absY > absX * 1.15) {
                    axisLocked.current = 'y';
                    // If locking vertical, verify we have context to swipe to
                    if (!contextualRow && !isContextualVisible) {
                        axisLocked.current = 'x'; // Force X if no vertical action possible
                    }
                } else if (absX > absY * 1.15) {
                    axisLocked.current = 'x';
                }
            }
        }

        if (axisLocked.current === 'y' && contextualRow) {
            // Manual Vertical Translation
            // Base Y is 0 (Row 0) or -ROW_HEIGHT (Row 1)
            // dragging UP (negative delta) from 0 -> goes to -ROW_HEIGHT
            // dragging DOWN (positive delta) from -ROW_HEIGHT -> goes to 0

            const currentBase = isContextualVisible ? -ROW_HEIGHT : 0;
            let newY = currentBase + offset.y;

            // Clamp
            // Min: -ROW_HEIGHT (Full Context Visible)
            // Max: 0 (Main Nav Visible)
            // Add some elasticity if desired, but strict clamping prevents 'flying'
            if (newY > 0) newY = newY * 0.2; // Elastic pull down
            if (newY < -ROW_HEIGHT) newY = -ROW_HEIGHT + (newY + ROW_HEIGHT) * 0.2; // Elastic pull up

            y.set(newY);

        } else if (axisLocked.current === 'x' || !axisLocked.current) {
            // Horizontal Scroll - Manual Handling since touch-action: none matches
            if (mainRowRef.current) {
                mainRowRef.current.scrollLeft -= delta.x;
            }
        }
    };

    const handlePanEnd = (event: any, info: any) => {
        if (axisLocked.current === 'y' && contextualRow) {
            const { offset, velocity } = info;
            const currentY = y.get(); // This drives the animation frame, but we need decision logic

            const isRow0 = !isContextualVisible;
            const threshold = ROW_HEIGHT * 0.25;

            let targetRow = isContextualVisible ? 1 : 0;

            // Flip Logic
            if (isRow0) {
                // Trying to go to Row 1 (Swipe Up)
                // offset.y is negative
                if (offset.y < -threshold || velocity.y < -200) {
                    targetRow = 1;
                }
            } else {
                // Trying to go to Row 0 (Swipe Down)
                // offset.y is positive
                if (offset.y > threshold || velocity.y > 200) {
                    targetRow = 0;
                }
            }

            // Commit
            if (targetRow === 1) {
                setContextualVisible(true);
                controls.start({ y: -ROW_HEIGHT });
            } else {
                setContextualVisible(false);
                controls.start({ y: 0 });
            }
        } else {
            // Reset if needed (e.g. if we started dragging but didn't lock Y)
            controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
        }

        axisLocked.current = null;
    };

    return (
        <nav
            className="fixed bottom-6 inset-x-6 z-50 floating-nav rounded-[2.5rem] bg-none pb-0 overflow-hidden h-[68px]"
            // touch-action: none allows both x and y to be captured by JS
            style={{ touchAction: "none" }}
        >
            <motion.div
                className="flex flex-col h-auto relative" // Auto height to fit children
                animate={controls}
                style={{ y }} // Bind MotionValue
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
            >
                {/* Row 0: Main Nav */}
                <div className="h-[68px] shrink-0">
                    <BottomNavRow ref={mainRowRef}>
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
                    <div className="h-[68px] shrink-0">
                        {contextualRow}
                    </div>
                )}
            </motion.div>
        </nav>
    );
}
