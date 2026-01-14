import { Button } from "@/components/ui/button";
import { BottomNavRow } from "@/components/BottomNavRow";
import { cn } from "@/lib/utils";
import { FileText, Send, Zap } from "lucide-react";

interface QuickAction {
    id: number;
    label: string;
    content: string;
    actionType: string;
}

interface QuickActionsRowProps {
    quickActions?: QuickAction[];
    onQuickActionRequest: (action: QuickAction) => void;
}

export function QuickActionsRow({
    quickActions = [],
    onQuickActionRequest,
}: QuickActionsRowProps) {
    const getActionIcon = (type: string) => {
        switch (type) {
            case "find_availability":
                return FileText;
            case "deposit_info":
                return Send; // Or a specific icon like CreditCard if available, using Send for now to match 'Book Now' vibe or FileText
            default:
                return Zap;
        }
    };

    return (
        <BottomNavRow>
            {/* User Configured Actions (SSOT) */}
            {quickActions?.map((action) => {
                const Icon = getActionIcon(action.actionType);
                return (
                    <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative text-muted-foreground opacity-70 hover:opacity-100"
                        )}
                        onClick={() => onQuickActionRequest(action)}
                    >
                        <div className="relative">
                            <Icon className={cn("w-6 h-6 mb-0.5", action.actionType === 'find_availability' ? "text-blue-500" : "text-amber-500")} />
                        </div>
                        <span className="text-[10px] font-medium font-normal truncate max-w-[80px]">
                            {action.label}
                        </span>
                    </Button>
                )
            })}
        </BottomNavRow>
    );
}
