import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
    return (
        <div className={cn(
            "fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden bg-background",
            // Ensure the background gradient from SSOT is applied (body has it usually, but fixed wrapper needs it if it covers body)
            // Actually, body has the gradient. Since this is fixed inset, it might overlay body.
            // So we should let it be transparent or apply the gradient again if needed.
            // But standard is usually transparency over body or inheriting.
            // However, user complained about dashboard background.
            // "Restore original background gradient (from SSOT tokens)"
            // index.css .dark body uses --bg-gradient.
            // So this wrapper should probably just be transparent or use the class that applies it?
            // If we make it bg-background, it uses the solid color.
            // Let's rely on standard layout. If it's fixed over body, it should be bg-transparent or re-apply gradient.
            // Let's stick to 'bg-background' which usually includes the gradient if defined in layers? 
            // No, --bg-gradient is set on body. 
            // So we should make this `bg-transparent` if body handles it, OR re-apply.
            // Let's use `bg-background` and assume `background-image` is set on it? 
            // Re-reading index.css: body { background: var(--bg-gradient); ... }
            // So if this div is on top, it needs to be transparent or match.
            "bg-transparent",
            className
        )}>
            {/* Optional: If we need the subtle overly logic again */}
            <div className="absolute inset-0 pointer-events-none -z-10" />
            {children}
        </div>
    );
}
