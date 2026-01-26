import { Button } from "@/components/ui";
import { BottomNavRow } from "@/components/BottomNavRow";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ChatAction {
    id: string | number;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    highlight?: boolean;
}

interface QuickActionsRowProps {
    actions: ChatAction[];
}

export function QuickActionsRow({
    actions = [],
}: QuickActionsRowProps) {
    return (
        <BottomNavRow>
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative text-muted-foreground opacity-70 hover:opacity-100"
                        )}
                        onClick={action.onClick}
                    >
                        <div className="relative">
                            <Icon className={cn("w-6 h-6 mb-0.5", action.highlight ? "text-blue-500" : "text-amber-500")} />
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
