import { Card } from "@/UI Library/Card";
import { Button } from "@/UI Library/Button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// --- SectionHeader ---
export const SectionHeader = ({ title, showAction = true, actionLabel = "Today" }: { title: string, showAction?: boolean, actionLabel?: string }) => (
    <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {showAction && (
            <Button size="sm" variant="default" className="shadow-[0_0_15px_rgba(91,78,255,0.25)]">
                {actionLabel}
            </Button>
        )}
    </div>
);

// --- MonthHeaderRow ---
export const MonthHeaderRow = ({ label }: { label: string }) => (
    <div className="py-3 flex items-center justify-between border-b border-white/5">
        <Button variant="ghost" size="icon" className="text-white/70">
            <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-white">{label}</h2>
        <Button variant="ghost" size="icon" className="text-white/70">
            <ChevronRight className="w-5 h-5" />
        </Button>
    </div>
);

// --- SegmentedControl ---
export const SegmentedControl = ({ options, activeIndex = 0 }: { options: string[], activeIndex?: number }) => (
    <div className="py-3 flex gap-2">
        {options.map((opt, i) => (
            <Button
                key={opt}
                variant={i === activeIndex ? "default" : "outline"}
                className="flex-1"
            >
                {opt}
            </Button>
        ))}
    </div>
);

// --- DayCard ---
export const DayCard = ({ weekday, dayNumber, isToday, appointmentsCount, children }: { weekday: string, dayNumber: string, isToday?: boolean, appointmentsCount: number, children?: React.ReactNode }) => (
    <Card className={cn(
        "p-4 min-h-[120px] bg-[#1a1a1a] mb-3",
        isToday && "border-primary border-2 shadow-[0_0_20px_rgba(91,78,255,0.15)]"
    )}>
        <div className="flex items-center justify-between mb-3">
            <div>
                <p className="text-xs text-white/50 uppercase tracking-tighter">{weekday}</p>
                <p className="text-2xl font-bold text-white">{dayNumber}</p>
            </div>
            <div className="text-right flex flex-col items-end">
                <p className="text-[10px] text-white/40">
                    {appointmentsCount} appointment{appointmentsCount !== 1 ? "s" : ""}
                </p>
                <Plus className="w-4 h-4 text-[#5b4eff] mt-1" />
            </div>
        </div>
        {children}
        {appointmentsCount === 0 && !children && <p className="text-center text-white/30 text-[11px] mt-4">No appointments</p>}
    </Card>
);

// --- AppointmentCard ---
export const AppointmentCard = ({ title, clientName, time, price }: { title: string, clientName?: string, time: string, price?: string }) => (
    <div className="p-2 rounded-lg bg-[#5b4eff]/10 border border-[#5b4eff]/20 mb-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        {clientName && <p className="text-xs text-white/50">{clientName}</p>}
        <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-white/40">{time}</p>
            {price && <p className="text-[10px] text-[#5b4eff] font-medium">${price}</p>}
        </div>
    </div>
);

// --- Spacer ---
export const Spacer = ({ size }: { size: "xs" | "sm" | "md" | "lg" }) => {
    const heights = { xs: "h-2", sm: "h-4", md: "h-8", lg: "h-16" };
    return <div className={heights[size]} />;
};

// --- Text ---
export const Text = ({ content, variant = "body" }: { content: string, variant?: "title" | "subtitle" | "muted" | "body" }) => {
    const styles = {
        title: "text-xl font-bold text-white",
        subtitle: "text-lg font-semibold text-white/90",
        muted: "text-sm text-white/50",
        body: "text-base text-white/80"
    };
    return <p className={styles[variant]}>{content}</p>;
};
