/**
 * UI SINGLE SOURCE OF TRUTH (SSOT)
 * -------------------------------
 * This file is part of the core UI primitives. Changes to gradients, blur, 
 * radius, or core styling MUST happen here. 
 * DO NOT OVERRIDE STYLES IN PAGE COMPONENTS.
 */
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GlassSheetProps {
    children: ReactNode;
    className?: string;
}

export function GlassSheet({ children, className }: GlassSheetProps) {
    return (
        <div className={cn(
            "flex-1 z-20 flex flex-col relative overflow-hidden",
            // SSOT Rules:
            // - Frosted glass with high blur
            // - Internal top-down subtle gradient
            // - Floating appearance over PageBackground
            "backdrop-blur-[40px] rounded-t-[2.5rem] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)]",
            "bg-gradient-to-b from-slate-950/50 to-slate-950/20 border-t border-white/10",
            className
        )}>
            {/* Top Shine Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            {children}
        </div>
    );
}
