
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet } from "lucide-react"; // REMOVED: Icons come from config
import { Link, useLocation } from "wouter";
import { useTotalUnreadCount } from "@/lib/selectors/conversation.selectors";
import { BottomNavRow } from "./BottomNavRow";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { motion, useAnimation, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";
import { MAIN_NAV_ITEMS } from "@/_core/bottomNav/defaultNav";

/* 
   ################################################################################
   #                           FROZEN API CONTRACT                                #
   ################################################################################
   #                                                                              #
   #  DO NOT ADD ROUTE LOGIC OR CONDITIONAL RENDERING IN THIS COMPONENT.          #
   #  DO NOT ADD HARDCODED BUTTONS HERE.                                          #
   #                                                                              #
   #  This component is a dumb renderer for the BottomNav System.                 #
   #  See: docs/bottom-nav.md for architectural rules.                            #
   #                                                                              #
   #  - Top Level Items: Edit client/src/_core/bottomNav/defaultNav.ts            #
   #  - Contextual Actions: Use `useRegisterBottomNavRow` in your Page component. #
   #                                                                              #
   ################################################################################
*/

const ROW_HEIGHT = 68; // px

export default function BottomNav() {
    const [location] = useLocation();
    const totalUnreadCount = useTotalUnreadCount();

    const isActive = (p?: string) => {
        if (!p) return false;
        if (p === "/" && location === "/") return true;
        if (p !== "/" && location.startsWith(p)) return true;
        return false;
    };

    // Config comes from canonical source
    const navItems = MAIN_NAV_ITEMS;

    const { rowIndex, isContextualVisible, setContextualVisible, contextualRow } = useBottomNav();

    // Animation Controls & Motion Values
    const controls = useAnimation();
    const y = useMotionValue(0);
    const x = useMotionValue(0); // Horizontal transform (negative offset)

    // Refs for DOM elements
    const viewportRef = useRef<HTMLDivElement>(null); // The outer pill
    const mainRowRef = useRef<HTMLDivElement>(null); // Row 0
    const row1Ref = useRef<HTMLDivElement>(null);    // Row 1 wrapper
    const captureLayerRef = useRef<HTMLDivElement>(null);

    // Manual Drag State - SSOT
    const offsetX = useRef(0); // Positive horizontal scroll offset
    const maxOffset = useRef(0);
    const viewportWidth = useRef(0);
    const isDragging = useRef(false);
    const startPoint = useRef({ x: 0, y: 0 });
    const startOffset = useRef(0);
    const axisLocked = useRef<'x' | 'y' | null>(null);
    const totalMove = useRef(0);

    // Measurement Logic
    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        const activeContent = isContextualVisible ? row1Ref.current : mainRowRef.current;

        if (viewport && activeContent) {
            viewportWidth.current = viewport.clientWidth;
            const contentWidth = activeContent.scrollWidth;
            maxOffset.current = Math.max(0, contentWidth - viewportWidth.current);

            // Re-clamp current offset if bounds changed
            const clamped = Math.max(0, Math.min(offsetX.current, maxOffset.current));
            if (clamped !== offsetX.current && !isDragging.current) {
                offsetX.current = clamped;
                x.set(-clamped);
            }
        }
    }, [isContextualVisible, x, contextualRow]); // Added contextualRow to deps

    // Observe Resizes
    useEffect(() => {
        measure();
        const obs = new ResizeObserver(() => measure());
        if (viewportRef.current) obs.observe(viewportRef.current);
        if (mainRowRef.current) obs.observe(mainRowRef.current);
        if (row1Ref.current) obs.observe(row1Ref.current);

        window.addEventListener('resize', measure);
        return () => {
            obs.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure, contextualRow]); // Re-measure if content changes

    // ... useEffect for Y (unchanged) - This is handled by controls.start calls and the motion.div animate prop.
    useEffect(() => {
        controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
    }, [isContextualVisible, controls]);


    const handlePointerDown = (e: React.PointerEvent) => {
        if (captureLayerRef.current) {
            captureLayerRef.current.setPointerCapture(e.pointerId);
        }

        measure(); // Ensure fresh bounds
        isDragging.current = true;
        startPoint.current = { x: e.clientX, y: e.clientY };
        startOffset.current = offsetX.current;
        axisLocked.current = null;
        totalMove.current = 0;

        console.log('[BottomNav] Pointer Down', { offset: offsetX.current, max: maxOffset.current });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const dx = e.clientX - startPoint.current.x;
        const dy = e.clientY - startPoint.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        totalMove.current = Math.max(totalMove.current, Math.hypot(dx, dy));

        // Axis Lock Logic: Threshold 8px
        if (!axisLocked.current) {
            if (absDx > 8 || absDy > 8) {
                if (absDx > absDy + 8) {
                    axisLocked.current = 'x';
                } else if (absDy > absDx + 8) {
                    axisLocked.current = 'y';
                    // Optional: If Row 0 and no contextual row, maybe prevent Y lock? 
                    // But requirement says vertical swipe is row switch.
                    // If no row 1, we might just rubberband.
                }
            }
        }

        if (axisLocked.current === 'x') {
            // Horizontal: Drag with Clamp
            const nextOffset = startOffset.current - dx;
            // Strict Clamp
            const clamped = Math.max(0, Math.min(nextOffset, maxOffset.current));

            offsetX.current = clamped;
            x.set(-clamped);

        } else if (axisLocked.current === 'y') {
            // Vertical: Drag Row Switch
            const currentBase = isContextualVisible ? -ROW_HEIGHT : 0;
            let targetY = currentBase + dy;

            // Elasticity for vertical
            if (targetY > 0) targetY = targetY * 0.2;
            if (targetY < -ROW_HEIGHT) targetY = -ROW_HEIGHT + (targetY + ROW_HEIGHT) * 0.2;

            y.set(targetY);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (captureLayerRef.current) {
            captureLayerRef.current.releasePointerCapture(e.pointerId);
        }

        // Tap Passthrough
        if (totalMove.current < 6 && captureLayerRef.current) {
            captureLayerRef.current.style.visibility = 'hidden';
            const target = document.elementFromPoint(e.clientX, e.clientY);
            captureLayerRef.current.style.visibility = 'visible';

            if (target && target instanceof HTMLElement) {
                target.click();
            }
            // Reset to stable state just in case
            controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
            return;
        }

        if (axisLocked.current === 'x') {
            // Horizontal Snap
            // Page Logic: closest page index
            const vp = viewportWidth.current || 1;
            const pageIndex = Math.round(offsetX.current / vp);
            let snapOffset = pageIndex * vp;

            // Hard clamp snap target
            snapOffset = Math.max(0, Math.min(snapOffset, maxOffset.current));

            animate(x, -snapOffset, { type: "spring", stiffness: 400, damping: 40 });
            offsetX.current = snapOffset;

        } else if (axisLocked.current === 'y') {
            // Vertical Snap (Row Switch)
            if (contextualRow) {
                const dy = e.clientY - startPoint.current.y;
                const threshold = ROW_HEIGHT * 0.25;
                const isRow0 = !isContextualVisible;
                let targetRow = isContextualVisible ? 1 : 0;

                if (isRow0) {
                    if (dy < -threshold) targetRow = 1;
                } else {
                    if (dy > threshold) targetRow = 0;
                }

                if (targetRow === 1) {
                    if (!isContextualVisible) setContextualVisible(true);
                    controls.start({ y: -ROW_HEIGHT });
                } else {
                    if (isContextualVisible) setContextualVisible(false);
                    controls.start({ y: 0 });
                }
            } else {
                // No secondary row, snap back
                controls.start({ y: 0 });
            }
        } else {
            // Reset if undefined gesture
            controls.start({ y: isContextualVisible ? -ROW_HEIGHT : 0 });
            animate(x, -offsetX.current, { type: "spring", stiffness: 400, damping: 40 });
        }

        axisLocked.current = null;
    };

    return (
        <nav
            ref={viewportRef}
            className="fixed bottom-6 inset-x-6 z-50 floating-nav rounded-[2.5rem] bg-none pb-0 overflow-hidden h-[68px] select-none touch-none overscroll-contain"
        >
            {/* Gesture Capture Layer - Invisible Overlay */}
            <div
                ref={captureLayerRef}
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                style={{ touchAction: "none" }} // Crucial to block browser scroll/refresh
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />

            <motion.div
                className="flex flex-col h-auto relative" // Content doesn't need pointer events directly, but links might need hover?
                // Wait, if content has pointer-events-none, hover states won't work visualy underneath the overlay?
                // Actually, the overlay block pointer events. So hover states on buttons won't trigger on Desktop mouse hover unless we do pass-through.
                // But this is primarily a touch/swipe interface improvement.
                // For desktop compatibility, passing 'pointer-events-none' to content is safest for 'click' simulation, 
                // BUT removing hover effects is a downside.
                // Re-eval: Keep pointer-events-auto on content. The overlay is on TOP.
                // Overlay captures events. So content never sees hover.
                // This is an acceptable tradeoff for "robust swipe" if requested, OR:
                // We can use pointer-events: none on overlay until drag? No.
                // We'll stick to the "Tap Passthrough" logic which handles clicks. Hover states will indeed be sacrificed on Desktop if overlay is always up.
                // Is there a way to keep hover? 
                // Only if overlay has pointer-events: none, but then we can't capture empty space swipes easily.
                // Given "BottomNav pill integrity" and "Gestures", reliable swipe > hover on desktop for a mobile-first app?
                // I will NOT force pointer-events-none on content, just in case passthrough works differently/better.
                // Actually, let's remove pointer-events-none from motion.div
                animate={controls}
                style={{ y }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
                {/* Row 0: Main Nav */}
                <div className="h-[68px] shrink-0">
                    <BottomNavRow ref={mainRowRef} style={{ x }}>
                        {navItems.map((item) => {
                            const active = isActive(item.path);

                            const ButtonContent = (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative",
                                        active ? "text-primary scale-105" : "text-muted-foreground opacity-70 hover:opacity-100"
                                    )}
                                    // Tab index needed since overlay might block focus handling? 
                                    tabIndex={-1}
                                    onClick={item.action}
                                >
                                    <div className="relative">
                                        <item.icon className={cn("w-6 h-6 mb-0.5", active && "fill-current/20")} />
                                        {item.id === "messages" && totalUnreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-background">
                                                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                            </span>
                                        )}
                                        {/* Support generic badge count if needed in future */}
                                        {item.badgeCount !== undefined && item.badgeCount > 0 && item.id !== 'messages' && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-background">
                                                {item.badgeCount}
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
                            );

                            if (item.path) {
                                return (
                                    <Link key={item.id} href={item.path}>
                                        {ButtonContent}
                                    </Link>
                                );
                            }

                            return (
                                <div key={item.id}>
                                    {ButtonContent}
                                </div>
                            );
                        })}
                    </BottomNavRow>
                </div>

                {/* Row 1: Contextual Row (if exists) */}
                {contextualRow && (
                    <div className="h-[68px] shrink-0">
                        {/* Wrapper to apply the same X transform to Row 1 */}
                        <motion.div
                            ref={row1Ref}
                            style={{ x }}
                            className="flex items-center w-max h-full"
                        >
                            {contextualRow}
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </nav>
    );
}

