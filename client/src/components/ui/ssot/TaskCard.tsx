import { Card } from "@/components/ui/card";
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
        high: "inset 6px 0 20px -4px rgba(220, 38, 38, 0.5), 0 0 0 1px rgba(220, 38, 38, 0.1)", // Red Glow
        medium: "inset 6px 0 20px -4px rgba(234, 88, 12, 0.5), 0 0 0 1px rgba(234, 88, 12, 0.1)", // Orange Glow
        low: "inset 6px 0 20px -4px rgba(16, 185, 129, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.1)" // Green Glow
    }[priority];

    return (
        <Card
            onClick={onClick}
            className={cn(
                "group p-4 relative overflow-hidden transition-all duration-300",
                "border-0 active:scale-[0.98] rounded-2xl cursor-pointer",
                "bg-white/5 hover:bg-white/10" // Neutral translucent
            )}
            style={{ boxShadow: priorityShadow }}
        >
            <div className="flex items-center gap-4 z-10 relative">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1 group-hover:text-white transition-colors duration-300">
                        {title}
                    </h3>
                    {context && (
                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-300">
                            {context}
                        </p>
                    )}
                </div>

                {/* Action Icon Indicator */}
                {actionType === 'email' && <Mail className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />}
                {actionType === 'sms' && <MessageSquare className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />}

                {/* Right Arrow / Plus / Check */}
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground group-hover:border-white/30 group-hover:text-foreground transition-colors">
                    {status === 'completed' ? <Check className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4" />}
                </div>
            </div>
        </Card>
    );
}
