import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SegmentedHeaderProps {
    options: string[];
    activeIndex: number;
    onChange: (index: number) => void;
    className?: string;
}

export function SegmentedHeader({ options, activeIndex, onChange, className }: SegmentedHeaderProps) {
    return (
        <div className={cn("flex w-full items-center justify-between gap-2", className)}>
            {options.map((title, index) => {
                const isActive = index === activeIndex;
                return (
                    <button
                        key={title}
                        onClick={() => onChange(index)}
                        className={cn(
                            "flex-1 text-center text-lg font-bold tracking-tight transition-all duration-300 ease-out py-2 outline-none rounded-lg",
                            isActive
                                ? "text-foreground opacity-100 scale-105"
                                : "text-muted-foreground opacity-50 hover:opacity-100 scale-95"
                        )}
                        style={{
                            // Ensure font smoothing/crispness
                            textShadow: isActive ? "0 0 20px rgba(255,255,255,0.3)" : "none"
                        }}
                    >
                        {title}
                    </button>
                );
            })}
        </div>
    );
}
