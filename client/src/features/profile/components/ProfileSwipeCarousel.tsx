import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useAnimation, PanInfo, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileSwipeCarouselProps {
    tabs: { id: string; label: string; content: React.ReactNode }[];
    defaultTab?: string;
    onTabChange?: (tabId: string) => void;
}

export function ProfileSwipeCarousel({ tabs, defaultTab, onTabChange }: ProfileSwipeCarouselProps) {
    // SSOT: Active Index
    const [activeIndex, setActiveIndex] = useState(() => {
        const found = tabs.findIndex(t => t.id === defaultTab);
        return found >= 0 ? found : 0;
    });

    // Measurement State
    const [containerWidth, setContainerWidth] = useState(0);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMeasureRef = useRef(0);
    const isDraggingRef = useRef(false);

    // Motion
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Measurement Logic (Debounced + Threshold)
    useEffect(() => {
        if (!containerRef.current) return;

        let rafId: number;

        const observer = new ResizeObserver((entries) => {
            // Debounce via RAF to avoid thrashing in one frame
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                for (const entry of entries) {
                    const width = entry.contentRect.width;
                    if (Math.abs(width - lastMeasureRef.current) > 2) {
                        lastMeasureRef.current = width;
                        setContainerWidth(width);
                    }
                }
            });
        });

        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Sync external active tab (only if prop changes meaningfully)
    useEffect(() => {
        if (defaultTab) {
            const found = tabs.findIndex(t => t.id === defaultTab);
            if (found >= 0 && found !== activeIndex) {
                setActiveIndex(found);
            }
        }
    }, [defaultTab, tabs, activeIndex]);

    // Snap Effect
    useEffect(() => {
        // Only snap if we have a valid width and are NOT dragging
        if (containerWidth > 0 && !isDraggingRef.current) {
            const targetX = -activeIndex * containerWidth;
            controls.start({
                x: targetX,
                transition: { type: "spring", stiffness: 300, damping: 30, bounce: 0 }
            });
        }
    }, [activeIndex, containerWidth, controls]);

    // Notify Parent
    useEffect(() => {
        onTabChange?.(tabs[activeIndex].id);
    }, [activeIndex, tabs, onTabChange]);


    // Handlers
    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        isDraggingRef.current = false;
        if (containerWidth === 0) return;

        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const currentX = x.get();

        // Calculate predicted index based on drag
        // We can just use the final position / width
        // But let's stick to the "intent" logic (threshold or velocity) relative to START
        // Actually, easiest robust way:

        const idealIndex = -currentX / containerWidth;
        let newIndex = Math.round(idealIndex);

        // Velocity override
        if (velocity < -300) {
            newIndex = Math.ceil(idealIndex); // Swipe Left -> ceil
        } else if (velocity > 300) {
            newIndex = Math.floor(idealIndex); // Swipe Right -> floor
        }

        // Clamp
        newIndex = Math.max(0, Math.min(newIndex, tabs.length - 1));

        setActiveIndex(newIndex);

        // Explicitly snap NOW (in case index didn't change, we still need to snap back)
        if (newIndex === activeIndex) {
            controls.start({
                x: -newIndex * containerWidth,
                transition: { type: "spring", stiffness: 300, damping: 30, bounce: 0 }
            });
        }
    };

    const maxDrag = containerWidth > 0 ? -((tabs.length - 1) * containerWidth) : 0;

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Dev Overlay */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 z-50 bg-black/80 text-white text-[9px] p-1 pointer-events-none font-mono border-l border-b border-white/10">
                    W:{Math.round(containerWidth)} | IDX:{activeIndex} | X:{Math.round(x.get())} | DRG:{isDraggingRef.current ? 'Y' : 'N'}
                </div>
            )}

            {/* Header Tabs */}
            <div className="flex items-center px-4 mb-2 shrink-0 overflow-x-auto no-scrollbar gap-6 z-10 relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                            "text-sm font-medium transition-colors whitespace-nowrap pb-2 border-b-2",
                            activeIndex === index
                                ? "text-primary border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Viewport - Static Measure Target */}
            <div
                ref={containerRef}
                className="flex-1 w-full relative overflow-hidden touch-pan-y"
            >
                {containerWidth > 0 && (
                    <motion.div
                        className="flex h-full"
                        style={{
                            x,
                            width: `${tabs.length * 100}%`,
                            cursor: "grab"
                        }}
                        whileTap={{ cursor: "grabbing" }}
                        drag="x"
                        dragConstraints={{ left: maxDrag, right: 0 }}
                        dragElastic={0.05}
                        dragMomentum={false}
                        animate={controls}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className="h-full overflow-y-auto overflow-x-hidden no-scrollbar pb-24"
                                style={{ width: containerWidth }}
                            >
                                <div className="px-4 h-full">
                                    {tab.content}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
