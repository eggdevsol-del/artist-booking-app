
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
    const priorityColor = {
        high: "bg-red-500",
        medium: "bg-orange-500",
        low: "bg-green-500"
    }[task.priority];

    return (
        <div className="group relative p-4 pr-6 border-0 bg-white/5 backdrop-blur-md rounded-[1.5rem] transition-all duration-300 active:scale-[0.98] border border-white/5">
            <div className="flex items-start gap-4">
                {/* Priority Bar */}
                <div className={cn("w-1.5 h-10 rounded-full flex-shrink-0 mt-1", priorityColor)} />

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1">
                        {task.title}
                    </h3>
                    {task.context && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {task.context}
                        </p>
                    )}
                </div>
            </div>
        </div>
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
    // We use a constraint on the drag to prevent swiping beyond the list
    // but for 3 items, index 0, 1, 2.

    // Framer motion variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
            filter: "blur(4px)"
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)"
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
            filter: "blur(4px)"
        })
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const [[page, direction], setPage] = useState([0, 0]);

    // Sync state if controlled externally, though here it's local
    const paginate = (newDirection: number) => {
        const newIndex = page + newDirection;
        if (newIndex < 0 || newIndex >= TITLES.length) return;
        setPage([newIndex, newDirection]);
        setActiveIndex(newIndex);
    };

    const activeCategory = TITLES[activeIndex].toLowerCase();
    const tasks = TASKS[activeCategory] || [];

    return (
        <div className="flex flex-col h-screen max-h-[100dvh] overflow-hidden bg-background text-foreground relative touch-none">

            {/* Focus Corridor Header */}
            <header className="flex-shrink-0 pt-6 pb-2 px-4 z-20 bg-gradient-to-b from-background via-background/95 to-transparent">
                <div className="flex items-baseline justify-between max-w-md mx-auto relative px-2">
                    {TITLES.map((title, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={title}
                                onClick={() => {
                                    const dir = index > activeIndex ? 1 : -1;
                                    setPage([index, dir]);
                                    setActiveIndex(index);
                                }}
                                className={cn(
                                    "text-2xl font-bold tracking-tight transition-all duration-500 ease-out py-2",
                                    isActive
                                        ? "text-foreground opacity-100 scale-100"
                                        : "text-muted-foreground opacity-30 blur-[2px] scale-90 pointer-events-none"
                                )}
                                style={{
                                    // Subtle alignment tweaks can happen here
                                    transformOrigin: index === 0 ? "left" : index === 2 ? "right" : "center"
                                }}
                            >
                                {title}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative w-full h-full">
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
                            scale: { duration: 0.2 },
                            filter: { duration: 0.2 }
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
                        // Axis locking: We allow vertical scroll on children, but horizontal drag on this container.
                        // touch-action: pan-y allows vertical scrolling while horizontal gestures are captured by the drag listener (if browsers support it)
                        // or we rely on framer-motion's dragDirectionLock
                        dragDirectionLock
                        className="absolute top-0 left-0 w-full h-full px-4 overflow-y-auto overflow-x-hidden mobile-scroll pb-24"
                        style={{ touchAction: "pan-y" }} // Crucial for allowing vertical scroll while horizontal drag is active
                    >
                        {/* Inner Content */}
                        <div className="space-y-3 pt-2 max-w-md mx-auto min-h-full">
                            {tasks.length > 0 ? (
                                tasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            ) : (
                                <EmptyState category={TITLES[activeIndex]} />
                            )}
                            {/* Bottom spacer */}
                            <div className="h-20" />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
