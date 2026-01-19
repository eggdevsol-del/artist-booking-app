import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SheetHeaderProps {
    children: ReactNode;
    className?: string;
}

export function SheetHeader({ children, className }: SheetHeaderProps) {
    return (
        <div className={cn(
            // SSOT Rules:
            // - Sticky sheet header (blur preserved)
            // - Distinct glass context
            "shrink-0 pt-6 pb-4 px-6 border-b border-white/5",
            "bg-white/[0.01] backdrop-blur-md", // Explicit header blur
            "z-10 relative",
            className
        )}>
            {children}
        </div>
    );
}
