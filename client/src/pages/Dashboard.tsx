
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Mock Data ---
type Priority = "high" | "medium" | "low";
type Task = {
    id: string;
    title: string;
    context?: string;
    priority: Priority;
};

const TASKS: Record<string, Task[]> = {
    business: [
        { id: "b1", title: "Review Q1 Strategy", context: "Prepare for board meeting", priority: "high" },
        { id: "b2", title: "Client Sync: Sarah", context: "Discuss final deliverables", priority: "medium" },
        { id: "b3", title: "Update Portfolio", context: "Add recent tattoo works", priority: "low" },
        { id: "b4", title: "Invoice Processing", context: "Send out monthly invoices", priority: "medium" },
    ],
    social: [
        { id: "s1", title: "Dinner with Mike", context: "7:00 PM @ Downtown", priority: "medium" },
        { id: "s2", title: "Reply to Comments", context: "Instagram latest post", priority: "low" },
    ],
    personal: [
        { id: "p1", title: "Gym Session", context: "Leg day", priority: "high" },
        { id: "p2", title: "Meditation", context: "15 mins before bed", priority: "medium" },
        { id: "p3", title: "Grocery Run", context: "Milk, eggs, protein powder", priority: "low" },
    ]
};

const TITLES = ["Business", "Social", "Personal"];

// --- Components ---

function TaskCard({ task }: { task: Task }) {
    const priorityGradient = {
        high: "linear-gradient(90deg, #dc2626 0%, rgba(127, 29, 29, 0.4) 4%, rgba(127, 29, 29, 0) 25%)",    // Red-600 -> Red-900/40 -> Transparent
        medium: "linear-gradient(90deg, #ea580c 0%, rgba(124, 45, 18, 0.4) 4%, rgba(124, 45, 18, 0) 25%)", // Orange-600 -> Orange-900/40 -> Transparent
        low: "linear-gradient(90deg, #059669 0%, rgba(6, 78, 59, 0.4) 4%, rgba(6, 78, 59, 0) 25%)"     // Emerald-600 -> Emerald-900/40 -> Transparent
    }[task.priority];

    return (
        <Card className="group p-4 pr-6 relative overflow-hidden transition-all duration-500 border-white/5 active:scale-[0.98] shadow-none rounded-2xl bg-white/5 hover:bg-white/10">

            {/* Priority Gradient Overlay */}
            <div
                className="absolute inset-y-0 left-0 w-1/3 pointer-events-none select-none transition-opacity duration-500"
                style={{ background: priorityGradient }}
            />

            <div className="flex items-start gap-4 z-10 relative pl-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1 group-hover:text-white transition-colors duration-300">
                        {task.title}
                    </h3>
                    {task.context && (
                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-300">
                            {task.context}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}

function EmptyState({ category }: { category: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64">
            <p className="text-muted-foreground/50 text-base font-medium">
                All clear for {category}.
            </p>
            <p className="text-muted-foreground/30 text-sm mt-1">
                Enjoy the calm.
            </p>
        </div>
    );
}

export default function Dashboard() {
    const [activeIndex, setActiveIndex] = useState(0);
    const selectedDate = new Date();

    // Framer motion variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
        })
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        const newIndex = page + newDirection;
        if (newIndex < 0 || newIndex >= TITLES.length) return;
        setPage([newIndex, newDirection]);
        setActiveIndex(newIndex);
    };

    const activeCategory = TITLES[activeIndex].toLowerCase();
    const tasks = TASKS[activeCategory] || [];

    return (
        // FIX 1 & 2: Use fixed positioning to guarantee viewport height and no scrolling.
        // Removed 'bg-black' to allow body gradient (SSOT) to show through.
        // Removed 'pb-20' to allow sheet to extend underneath the bottom nav (Overlay behavior).
        <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden">

            {/* 1. Page Header (Fixed) */}
            <header className="px-4 py-4 z-10 shrink-0">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            </header>

            {/* 2. Top Context Area (Non-interactive, Fixed) */}
            <div className="px-6 pt-4 pb-8 z-10 shrink-0 flex flex-col justify-center h-[20vh] opacity-80">
                <p className="text-4xl font-light text-foreground/90 tracking-tight">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p className="text-muted-foreground text-lg font-medium mt-1">
                    {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </p>
            </div>

            {/* 3. Task Sheet (Active Zone, Flexible but contained) */}
            {/* FIX 3 & 4: Sheet container is overflow-hidden, only inner list scrolls */}
            <div className="flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative">

                {/* Top Edge Highlight (Gradient Right -> Left) */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Sheet Header (Anchored) */}
                <div className="shrink-0 pt-6 pb-2 px-6 border-b border-white/5">
                    <div className="flex items-center justify-between max-w-sm">
                        {TITLES.map((title, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <button
                                    key={title}
                                    onClick={() => {
                                        const dir = index > activeIndex ? 1 : -1;
                                        if (index !== activeIndex) {
                                            setPage([index, dir]);
                                            setActiveIndex(index);
                                        }
                                    }}
                                    className={cn(
                                        "text-lg font-bold tracking-tight transition-all duration-300 ease-out py-2 outline-none",
                                        isActive
                                            ? "text-foreground opacity-100"
                                            : "text-muted-foreground/50 hover:text-muted-foreground/80"
                                    )}
                                    style={{
                                        filter: isActive ? "none" : "blur(0.5px)",
                                    }}
                                >
                                    {title}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sheet Content (Swipeable + Scrollable) */}
                <div className="flex-1 relative w-full overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = swipePower(offset.x, velocity.x);
                                if (swipe < -swipeConfidenceThreshold) {
                                    paginate(1);
                                } else if (swipe > swipeConfidenceThreshold) {
                                    paginate(-1);
                                }
                            }}
                            dragDirectionLock
                            // FIX 5: Scrollable area is vertically scrollable (overflow-y-auto)
                            className="absolute top-0 left-0 w-full h-full px-4 pt-4 overflow-y-auto mobile-scroll touch-pan-y"
                        >
                            {/* Add padding at bottom to avoid content being cut off by rounded corners or strict clipping */}
                            {/* Increased to pb-32 to fully clear the Bottom Navigation overlay */}
                            <div className="space-y-3 pb-32 max-w-lg mx-auto">
                                {tasks.length > 0 ? (
                                    tasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                ) : (
                                    <EmptyState category={TITLES[activeIndex]} />
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
