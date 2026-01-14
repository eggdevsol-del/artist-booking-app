
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

    // Animation Controls & Motion Values
    const controls = useAnimation();
    const y = useMotionValue(0);
    const mainRowRef = useRef<HTMLDivElement>(null);

    // Manual Drag State
    const isDragging = useRef(false);
    const startPoint = useRef({ x: 0, y: 0 }); // Pointer start
    const axisLocked = useRef<'x' | 'y' | null>(null);
    const initialOffset = useRef(0); // Where Y motion value started
    const scrollStart = useRef(0); // Where X scroll started

    // Sync animation with state changes when NOT dragging
    useEffect(() => {
        if (!isDragging.current) {
            controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
        }
    }, [isContextualVisible, controls]);

    // Pointer Events Handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        // Essential: capture pointer to track movement even if it leaves element
        e.currentTarget.setPointerCapture(e.pointerId);

        isDragging.current = true;
        startPoint.current = { x: e.clientX, y: e.clientY };
        axisLocked.current = null;

        // Capture current state
        initialOffset.current = y.get();
        if (mainRowRef.current) {
            scrollStart.current = mainRowRef.current.scrollLeft;
        }

        console.log('[BottomNav] Pointer Down', { x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const dx = e.clientX - startPoint.current.x;
        const dy = e.clientY - startPoint.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Axis Locking (Threshold > 14px)
        if (!axisLocked.current) {
            if (absDx + absDy > 14) {
                if (absDy > absDx * 1.2) {
                    axisLocked.current = 'y';
                    // Check if vertical action is possible
                    if (!contextualRow && !isContextualVisible) {
                        axisLocked.current = 'x'; // Fallback to scroll if no row to switch to
                    }
                } else if (absDx > absDy * 1.2) {
                    axisLocked.current = 'x';
                }

                console.log('[BottomNav] Axis Locked', axisLocked.current);
            }
        }

        if (axisLocked.current === 'y') {
            // Vertical Paging Logic
            // Clamp translation:
            // If starting at 0 (Row 0), can go up to -ROW_HEIGHT
            // If starting at -ROW_HEIGHT (Row 1), can go down to 0

            // Logic: Target Y = Start base + dy
            // Clamped between -ROW_HEIGHT and 0

            const currentBase = isContextualVisible ? -ROW_HEIGHT : 0;
            let targetY = currentBase + dy;

            // Elasticity / Clamping
            if (targetY > 0) targetY = targetY * 0.2; // Dragging down from top
            if (targetY < -ROW_HEIGHT) targetY = -ROW_HEIGHT + (targetY + ROW_HEIGHT) * 0.2; // Dragging up from bottom

            y.set(targetY);

            console.log('[BottomNav] Y Drag', { dy, targetY });

        } else if (axisLocked.current === 'x') {
            // Horizontal Scrolling
            if (mainRowRef.current) {
                mainRowRef.current.scrollLeft = scrollStart.current - dx;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (axisLocked.current === 'y') {
            const dy = e.clientY - startPoint.current.y;
            const absDy = Math.abs(dy);
            const threshold = ROW_HEIGHT * 0.25;

            // Velocity approximation could be added, but threshold is robust
            const isRow0 = !isContextualVisible;

            let targetRow = isContextualVisible ? 1 : 0; // default to staying put

            if (isRow0) {
                // On Row 0. Swipe UP (negative dy) > threshold commits to Row 1
                if (dy < -threshold) targetRow = 1;
            } else {
                // On Row 1. Swipe DOWN (positive dy) > threshold commits to Row 0
                if (dy > threshold) targetRow = 0;
            }

            console.log('[BottomNav] Commit Check', { dy, threshold, targetRow });

            if (targetRow === 1) {
                if (!isContextualVisible) setContextualVisible(true);
                controls.start({ y: -ROW_HEIGHT });
            } else {
                if (isContextualVisible) setContextualVisible(false);
                controls.start({ y: 0 });
            }

        } else {
            // Snap back if no lock or X lock (X doesn't snap Y)
            controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
        }

        axisLocked.current = null;
    };

    return (
        <nav
            className="fixed bottom-6 inset-x-6 z-50 floating-nav rounded-[2.5rem] bg-none pb-0 overflow-hidden h-[68px]"
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <motion.div
                className="flex flex-col h-auto relative"
                animate={controls}
                style={{ y }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
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
                                    // Stop propagation on buttons to effectively use them? 
                                    // Actually no, we want swipes to start even if on a button.
                                    // If a button is clicked without drag, standard click event fires.
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

                {/* Row 1: Contextual Row - Always render if exists! */}
                {contextualRow && (
                    <div className="h-[68px] shrink-0">
                        {contextualRow}
                    </div>
                )}
                {/* 
                   If contextualRow is conditionally rendered, we still need space?
                   The current implementation renders <div> if contextualRow is truthy.
                   If not truthy, we just have 1 row. y is clamped to 0. Correct.
                */}
            </motion.div>
        </nav>
    );
}
