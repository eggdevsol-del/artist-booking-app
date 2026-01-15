import { Button } from "@/components/ui/button";
import { Grid, History, LayoutTemplate } from "lucide-react";

interface StatsRowProps {
    onJump: (section: 'boards' | 'photos' | 'history') => void;
    counts: {
        boards: number;
        photos: number;
        history: number;
    }
}

export function StatsRow({ onJump, counts }: StatsRowProps) {
    return (
        <div className="flex items-center justify-center gap-3 px-4 mb-8">
            <StatsCard
                label="Boards"
                count={counts.boards}
                icon={LayoutTemplate}
                onClick={() => onJump('boards')}
            />
            <StatsCard
                label="Photos"
                count={counts.photos}
                icon={Grid}
                onClick={() => onJump('photos')}
            />
            <StatsCard
                label="History"
                count={counts.history}
                icon={History}
                onClick={() => onJump('history')}
            />
        </div>
    );
}

function StatsCard({ label, count, icon: Icon, onClick }: { label: string, count: number, icon: any, onClick: () => void }) {
    return (
        <Button
            variant="ghost"
            className="flex-1 h-auto flex flex-col items-center py-3 px-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
            onClick={onClick}
        >
            <div className="text-lg font-bold text-foreground mb-0.5">{count}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <Icon className="w-3 h-3" />
                {label}
            </div>
        </Button>
    )
}
