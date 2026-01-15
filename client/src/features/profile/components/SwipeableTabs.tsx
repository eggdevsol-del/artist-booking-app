import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeableTabsProps {
    tabs: { id: string; label: string; content: React.ReactNode }[];
    defaultTab?: string;
    onTabChange?: (tabId: string) => void;
}

export function SwipeableTabs({ tabs, defaultTab, onTabChange }: SwipeableTabsProps) {
    // Index State
    const [activeIndex, setActiveIndex] = useState(() => {
        const found = tabs.findIndex(t => t.id === defaultTab);
        return found >= 0 ? found : 0;
    });

    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    // Sync external active tab change if props change (optional, but good for "New Board" jump)
    useEffect(() => {
        if (defaultTab) {
            const found = tabs.findIndex(t => t.id === defaultTab);
            if (found >= 0 && found !== activeIndex) {
                setActiveIndex(found);
            }
        }
    }, [defaultTab, tabs]);

    // Measure Container
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        setContainerWidth(containerRef.current.clientWidth); // Initial

        return () => observer.disconnect();
    }, []);

    // Snap Animation to Index
    useEffect(() => {
        if (containerWidth > 0) {
            animate(x, -activeIndex * containerWidth, {
                type: "spring",
                stiffness: 300,
                damping: 30,
                bounce: 0
            });
        }
    }, [activeIndex, containerWidth, x]);

    // Notify Parent
    useEffect(() => {
        onTabChange?.(tabs[activeIndex].id);
    }, [activeIndex, tabs, onTabChange]);


    const handleDragEnd = useCallback((event: any, info: PanInfo) => {
        if (containerWidth === 0) return;

        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const threshold = containerWidth / 3;

        let newIndex = activeIndex;

        // Swipe Left (Next)
        if (offset < -threshold || velocity < -300) {
            newIndex = Math.min(activeIndex + 1, tabs.length - 1);
        }
        // Swipe Right (Prev)
        else if (offset > threshold || velocity > 300) {
            newIndex = Math.max(activeIndex - 1, 0);
        }

        setActiveIndex(newIndex);
    }, [activeIndex, containerWidth, tabs.length]);

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Dev Overlay */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 z-50 bg-black/80 text-white text-[9px] p-1 pointer-events-none font-mono">
                    W:{Math.round(containerWidth)} | IDX:{activeIndex}
                </div>
            )}

            {/* Header Tabs (Clickable) */}
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

            {/* Swipeable Viewport */}
            {/* touch-action: pan-y Allows vertical scroll but captures horizontal swipes for us */}
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
                        dragConstraints={{
                            left: -((tabs.length - 1) * containerWidth),
                            right: 0
                        }}
                        dragElastic={0.05} // Minimal elasticity logic to prevent over-drag
                        dragMomentum={false} // We handle snap manually
                        onDragEnd={handleDragEnd}
                    >
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className="h-full overflow-y-auto overflow-x-hidden no-scrollbar pb-24"
                                style={{ width: containerWidth }}
                            >
                                {/* Padded container inside for content */}
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
