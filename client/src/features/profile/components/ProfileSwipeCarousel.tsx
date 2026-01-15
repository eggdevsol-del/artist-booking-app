import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useAnimation, PanInfo } from "framer-motion";
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
    const isSnappingRef = useRef(false);
    const lastDefaultTabRef = useRef(defaultTab);

    // Motion
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Measurement Logic
    useEffect(() => {
        if (!containerRef.current) return;

        let rafId: number;
        const observer = new ResizeObserver((entries) => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (isDraggingRef.current || isSnappingRef.current) return;

                for (const entry of entries) {
                    const width = Math.round(entry.contentRect.width);
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

    // Authority: Snap Helper
    // Single controlled way to change position
    const snapToIndex = useCallback(async (index: number, width: number) => {
        if (width === 0) return;

        const targetX = -index * width;
        isSnappingRef.current = true;

        await controls.start({
            x: targetX,
            transition: { type: "spring", stiffness: 300, damping: 30, bounce: 0 }
        });

        isSnappingRef.current = false;
    }, [controls]);

    // Handle Tab Jump
    const handleTabJump = useCallback((index: number) => {
        setActiveIndex(index);
        snapToIndex(index, containerWidth);
    }, [containerWidth, snapToIndex]);

    // 1) Refactored defaultTab sync: Only runs when defaultTab value actually changes
    useEffect(() => {
        if (defaultTab !== lastDefaultTabRef.current) {
            lastDefaultTabRef.current = defaultTab;
            const found = tabs.findIndex(t => t.id === defaultTab);
            if (found >= 0 && found !== activeIndex) {
                handleTabJump(found);
            }
        }
    }, [defaultTab, tabs, activeIndex, handleTabJump]);

    // 3) Handle tabs changes: clamp index if length changes, without reset
    useEffect(() => {
        if (activeIndex >= tabs.length) {
            const clamped = Math.max(0, tabs.length - 1);
            setActiveIndex(clamped);
            snapToIndex(clamped, containerWidth);
        }
    }, [tabs.length, activeIndex, containerWidth, snapToIndex]);

    // Initial Mount / ContainerWidth Snap
    useEffect(() => {
        if (containerWidth > 0 && !isDraggingRef.current && !isSnappingRef.current) {
            // Initial position sync on first width known
            x.set(-activeIndex * containerWidth);
        }
    }, [containerWidth]); // Only run when width flips from 0 to something

    // Notify Parent
    useEffect(() => {
        if (tabs[activeIndex]) {
            onTabChange?.(tabs[activeIndex].id);
        }
    }, [activeIndex, tabs, onTabChange]);

    // Handlers
    const handleDragStart = useCallback(() => {
        isDraggingRef.current = true;
        controls.stop();
    }, [controls]);

    const handleDragEnd = useCallback(async (event: any, info: PanInfo) => {
        isDraggingRef.current = false;
        if (containerWidth === 0) return;

        const currentX = x.get();
        const velocity = info.velocity.x;
        const idealIndex = -currentX / containerWidth;
        let newIndex = Math.round(idealIndex);

        if (velocity < -500) {
            newIndex = Math.ceil(idealIndex);
        } else if (velocity > 500) {
            newIndex = Math.floor(idealIndex);
        }

        newIndex = Math.max(0, Math.min(newIndex, tabs.length - 1));

        setActiveIndex(newIndex);
        await snapToIndex(newIndex, containerWidth);
    }, [containerWidth, tabs.length, x, snapToIndex]);

    const dragConstraints = useMemo(() => {
        if (containerWidth === 0) return { left: 0, right: 0 };
        return {
            left: -((tabs.length - 1) * containerWidth),
            right: 0
        };
    }, [containerWidth, tabs.length]);

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 z-50 bg-black/80 text-white text-[9px] p-1 pointer-events-none font-mono border-l border-b border-white/10">
                    W:{containerWidth} | IDX:{activeIndex} | DRG:{isDraggingRef.current ? 'Y' : 'N'} | SNP:{isSnappingRef.current ? 'Y' : 'N'}
                </div>
            )}

            <div className="flex items-center px-4 mb-2 shrink-0 overflow-x-auto no-scrollbar gap-6 z-10 relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabJump(index)}
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

            <div ref={containerRef} className="flex-1 w-full relative overflow-hidden touch-pan-y">
                {containerWidth > 0 && (
                    <motion.div
                        className="flex h-full"
                        style={{ x, width: `${tabs.length * 100}%`, cursor: "grab" }}
                        whileTap={{ cursor: "grabbing" }}
                        drag="x"
                        dragConstraints={dragConstraints}
                        dragElastic={0}
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
                                <div className="px-4 h-full">{tab.content}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
