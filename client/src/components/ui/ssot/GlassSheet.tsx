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
            // - Translucent sheet (blur + rounded top corners)
            // - Uses .liquid-glass tokens concept but adapted for a full sheet
            "backdrop-blur-[32px] rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
            // Dark glass tint matching 'Gold Standard' preference
            "bg-slate-950/40 border-t border-white/5",
            className
        )}>
            {/* Top Highlight Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />
            {children}
        </div>
    );
}
