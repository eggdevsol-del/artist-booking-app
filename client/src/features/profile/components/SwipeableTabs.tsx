import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeableTabsProps {
    tabs: { id: string; label: string; content: React.ReactNode }[];
    defaultTab?: string;
    onTabChange?: (tabId: string) => void;
}

export function SwipeableTabs({ tabs, defaultTab, onTabChange }: SwipeableTabsProps) {
    const [activeTab, setActiveTab] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    const handleTabClick = (index: number) => {
        setActiveTab(index);
    };

    // Sync x with activeTab
    useEffect(() => {
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            animate(x, -activeTab * width, { type: "spring", bounce: 0, duration: 0.4 });
        }
        if (onTabChange) {
            onTabChange(tabs[activeTab].id);
        }
    }, [activeTab, x, tabs, onTabChange]);

    const handleDragEnd = (event: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const width = containerRef.current?.clientWidth || 0;

        if (offset < -width / 3 || velocity < -500) {
            if (activeTab < tabs.length - 1) setActiveTab(activeTab + 1);
        } else if (offset > width / 3 || velocity > 500) {
            if (activeTab > 0) setActiveTab(activeTab - 1);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Headers */}
            <div className="flex items-center px-4 mb-4 overflow-x-auto no-scrollbar gap-6">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(index)}
                        className={cn(
                            "text-sm font-medium transition-colors whitespace-nowrap pb-2 border-b-2",
                            activeTab === index
                                ? "text-primary border-primary"
                                : "text-muted-foreground border-transparent hover:text-white"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Swipeable Area */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative touch-pan-y">
                <motion.div
                    className="flex h-full"
                    style={{ x, width: `${tabs.length * 100}%` }}
                    drag="x"
                    dragConstraints={{ left: -((tabs.length - 1) * (containerRef.current?.clientWidth || 0)), right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                >
                    {tabs.map((tab) => (
                        <div key={tab.id} className="flex-1 h-full overflow-y-auto px-4 pb-24 no-scrollbar container-snap">
                            {tab.content}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
