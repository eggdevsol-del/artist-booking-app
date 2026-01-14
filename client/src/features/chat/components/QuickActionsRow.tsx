import { Button } from "@/components/ui/button";
import { BottomNavRow } from "@/components/BottomNavRow";
import { cn } from "@/lib/utils";
import { FileText, Send, Zap } from "lucide-react";

interface QuickActionsRowProps {
    onOpenQuickActions: () => void;
    onSendProposal: () => void;
    onBookNow: () => void;
}

export function QuickActionsRow({
    onOpenQuickActions,
    onSendProposal,
    onBookNow,
}: QuickActionsRowProps) {
    const actions = [
        {
            label: "Quick Actions",
            icon: Zap,
            onClick: onOpenQuickActions,
            className: "text-amber-500",
        },
        {
            label: "Proposal",
            icon: FileText,
            onClick: onSendProposal,
            className: "text-blue-500",
        },
        {
            label: "Book Now",
            icon: Send,
            onClick: onBookNow,
            className: "text-green-500",
        },
    ];

    return (
        <BottomNavRow>
            {actions.map((action) => (
                <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative text-muted-foreground opacity-70 hover:opacity-100"
                    )}
                    onClick={action.onClick}
                >
                    <div className="relative">
                        <action.icon className={cn("w-6 h-6 mb-0.5", action.className)} />
                    </div>
                    <span className="text-[10px] font-medium font-normal">
                        {action.label}
                    </span>
                </Button>
            ))}
        </BottomNavRow>
    );
}
