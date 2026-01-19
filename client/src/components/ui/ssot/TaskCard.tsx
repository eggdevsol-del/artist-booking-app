import { Card } from "@/components/ui/card";
/**
 * UI SINGLE SOURCE OF TRUTH (SSOT)
 * -------------------------------
 * This file is part of the core UI primitives. Changes to gradients, blur, 
 * radius, or core styling MUST happen here. 
 * DO NOT OVERRIDE STYLES IN PAGE COMPONENTS.
 */
import { cn } from "@/lib/utils";
import { Check, Mail, MessageSquare, Plus } from "lucide-react";

export interface TaskCardProps {
    title: string;
    context?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'completed' | 'snoozed' | 'dismissed';
    actionType: 'none' | 'email' | 'sms' | 'social' | 'internal';
    onClick?: () => void;
}

export function TaskCard({ title, context, priority, status, actionType, onClick }: TaskCardProps) {
    // SSOT Rules:
    // - Left-edge glow for priority (not full-card tint)
    // - Red = urgent, Orange = time-sensitive, Green = maintenance
    // - Neutral translucent background

    const priorityShadow = {
        high: "inset 8px 0 24px -6px rgba(239, 68, 68, 0.4), inset 1px 0 0 0 rgba(239, 68, 68, 0.6)", // Vibrant Red Glow
        medium: "inset 8px 0 24px -6px rgba(249, 115, 22, 0.4), inset 1px 0 0 0 rgba(249, 115, 22, 0.6)", // Vibrant Orange Glow
        low: "inset 8px 0 24px -6px rgba(34, 197, 94, 0.4), inset 1px 0 0 0 rgba(34, 197, 94, 0.6)" // Vibrant Green Glow
    }[priority];

    return (
        <Card
            onClick={onClick}
            className={cn(
                "group p-5 relative overflow-hidden transition-all duration-300",
                "border-0 active:scale-[0.98] rounded-2xl cursor-pointer",
                "bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md", // Strict neutral glass
                "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]"
            )}
            style={{ boxShadow: priorityShadow }}
        >
            <div className="flex items-center gap-4 z-10 relative">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1 group-hover:text-white transition-colors duration-300">
                        {title}
                    </h3>
                    {context && (
                        <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium transition-colors duration-300">
                            {context}
                        </p>
                    )}
                </div>

                {/* Right Action Circle */}
                <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-muted-foreground/40 group-hover:border-white/20 group-hover:text-foreground transition-all duration-300 bg-white/[0.02]">
                    {status === 'completed' ? <Check className="w-5 h-5 text-green-500" /> : <Plus className="w-5 h-5" />}
                </div>
            </div>

            {/* Subtle Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        </Card>
    );
}
