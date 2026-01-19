
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboardTasks } from "@/features/dashboard/useDashboardTasks";
import { CHALLENGE_TEMPLATES, DashboardTask } from "@/features/dashboard/DashboardTaskRegister";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Check, Clock, ExternalLink, MessageSquare, Mail, Play, Plus } from "lucide-react";

// --- Components ---

function TaskCard({ task, onClick }: { task: DashboardTask; onClick: () => void }) {
    const priorityGradient = {
        high: "linear-gradient(90deg, #dc2626 0%, rgba(127, 29, 29, 0.4) 4%, rgba(127, 29, 29, 0) 25%)",
        medium: "linear-gradient(90deg, #ea580c 0%, rgba(124, 45, 18, 0.4) 4%, rgba(124, 45, 18, 0) 25%)",
        low: "linear-gradient(90deg, #059669 0%, rgba(6, 78, 59, 0.4) 4%, rgba(6, 78, 59, 0) 25%)"
    }[task.priority];

    return (
        <Card
            onClick={onClick}
            className="group p-4 pr-6 relative overflow-hidden transition-all duration-300 border-white/5 active:scale-[0.98] shadow-none rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer"
        >
            {/* Priority Gradient Overlay */}
            <div
                className="absolute inset-y-0 left-0 w-1/3 pointer-events-none select-none transition-opacity duration-500"
                style={{ background: priorityGradient }}
            />

            <div className="flex items-center gap-4 z-10 relative pl-2">
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
                {/* Visual indicator that it's actionable */}
                {task.status === 'completed' ? (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Check className="w-5 h-5" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground group-hover:border-white/30 group-hover:text-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                )}
            </div>
        </Card>
    );
}

function EmptyState({ category, onAction }: { category: string; onAction?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64">
            <p className="text-muted-foreground/50 text-base font-medium">
                All clear for {category}.
            </p>
            {category === 'Personal' && onAction && (
                <Button variant="outline" className="mt-4 border-white/10 bg-white/5" onClick={onAction}>
                    Start New Challenge
                </Button>
            )}
            {category !== 'Personal' && (
                <p className="text-muted-foreground/30 text-sm mt-1">
                    Enjoy the calm.
                </p>
            )}
        </div>
    );
}

const TITLES = ["Business", "Social", "Personal"];

export default function Dashboard() {
    const [activeIndex, setActiveIndex] = useState(0);
    const selectedDate = new Date();

    // Feature Hook
    const { tasks: allTasks, actions, stats } = useDashboardTasks();

    // UI State
    const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
    const [showTaskSheet, setShowTaskSheet] = useState(false);
    const [showChallengeSheet, setShowChallengeSheet] = useState(false);

    // Derived State
    const activeCategory = TITLES[activeIndex].toLowerCase() as 'business' | 'social' | 'personal';
    const currentTasks = allTasks[activeCategory] || [];

    // Handlers
    const handleTaskClick = (task: DashboardTask) => {
        setSelectedTask(task);
        setShowTaskSheet(true);
    };

    const executeAction = (task: DashboardTask) => {
        const { actionType, actionPayload } = task;

        switch (actionType) {
            case 'sms':
                if (actionPayload) window.location.href = `sms:${actionPayload}`;
                else setShowTaskSheet(true); // Fallback if no number, show sheet (which we are likely already in)
                break;
            case 'email':
                window.location.href = `mailto:${actionPayload || ''}`;
                break;
            case 'social':
                if (actionPayload) window.open(actionPayload, '_blank');
                break;
            case 'internal':
                // Placeholder router push
                console.log("Navigating to:", actionPayload);
                break;
            default:
                break;
        }
    };

    // Framer motion variants
    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? "100%" : "-100%", opacity: 0 })
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        const newIndex = page + newDirection;
        if (newIndex < 0 || newIndex >= TITLES.length) return;
        setPage([newIndex, newDirection]);
        setActiveIndex(newIndex);
    };

    return (
        <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden">

            {/* 1. Page Header */}
            <header className="px-4 py-4 z-10 shrink-0 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                {/* Social Streak Indicator */}
                {stats.socialStreak > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold">{stats.socialStreak}d Streak</span>
                    </div>
                )}
            </header>

            {/* 2. Top Context Area */}
            <div className="px-6 pt-4 pb-8 z-10 shrink-0 flex flex-col justify-center h-[20vh] opacity-80">
                <p className="text-4xl font-light text-foreground/90 tracking-tight">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p className="text-muted-foreground text-lg font-medium mt-1">
                    {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </p>
            </div>

            {/* 3. Sheet Container */}
            <div className="flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Sheet Header */}
                <div className="shrink-0 pt-6 pb-2 px-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
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
                                        style={{ filter: isActive ? "none" : "blur(0.5px)" }}
                                    >
                                        {title}
                                    </button>
                                );
                            })}
                        </div>
                        {activeCategory === 'personal' && !stats.activeChallengeId && (
                            <Button size="sm" variant="ghost" onClick={() => setShowChallengeSheet(true)} className="h-8 w-8 p-0 rounded-full bg-white/5 border border-white/10">
                                <Plus className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sheet Content */}
                <div className="flex-1 relative w-full overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = swipePower(offset.x, velocity.x);
                                if (swipe < -swipeConfidenceThreshold) paginate(1);
                                else if (swipe > swipeConfidenceThreshold) paginate(-1);
                            }}
                            dragDirectionLock
                            className="absolute top-0 left-0 w-full h-full px-4 pt-4 overflow-y-auto mobile-scroll touch-pan-y"
                        >
                            <div className="space-y-3 pb-32 max-w-lg mx-auto">
                                {currentTasks.length > 0 ? (
                                    currentTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                                    ))
                                ) : (
                                    <EmptyState category={TITLES[activeIndex]} onAction={activeCategory === 'personal' ? () => setShowChallengeSheet(true) : undefined} />
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* --- ACTION SHEET --- */}
            <Dialog open={showTaskSheet} onOpenChange={setShowTaskSheet}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-[101] w-full bg-background/90 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-6 pb-12 shadow-2xl space-y-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300">
                        <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-2" />

                        {selectedTask && (
                            <>
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-bold">{selectedTask.title}</DialogTitle>
                                    <p className="text-muted-foreground">{selectedTask.context}</p>
                                </div>

                                <div className="grid gap-3">
                                    {/* Primary Action */}
                                    {selectedTask.actionType !== 'none' && (
                                        <Button
                                            size="lg"
                                            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                            onClick={() => executeAction(selectedTask)}
                                        >
                                            {selectedTask.actionType === 'sms' && <MessageSquare className="mr-2 w-5 h-5" />}
                                            {selectedTask.actionType === 'email' && <Mail className="mr-2 w-5 h-5" />}
                                            {selectedTask.actionType === 'social' && <ExternalLink className="mr-2 w-5 h-5" />}
                                            {selectedTask.actionType === 'internal' && <Play className="mr-2 w-5 h-5" />}
                                            Execute Action
                                        </Button>
                                    )}

                                    {/* Task Management Actions */}
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"
                                        onClick={() => { actions.markDone(selectedTask.id); setShowTaskSheet(false); }}
                                    >
                                        <Check className="mr-2 w-5 h-5 text-green-500" />
                                        Mark Completed
                                    </Button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5"
                                            onClick={() => { actions.snooze(selectedTask.id); setShowTaskSheet(false); }}
                                        >
                                            <Clock className="mr-2 w-4 h-4" />
                                            Snooze 24h
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5 text-muted-foreground"
                                            onClick={() => { actions.dismiss(selectedTask.id); setShowTaskSheet(false); }}
                                        >
                                            <X className="mr-2 w-4 h-4" />
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </Dialog>

            {/* --- CHALLENGE SHEET --- */}
            <Dialog open={showChallengeSheet} onOpenChange={setShowChallengeSheet}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-[101] max-h-[85vh] w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-0 shadow-2xl overflow-hidden flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300">
                        <div className="px-6 py-4 border-b border-white/5 shrink-0">
                            <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-4" />
                            <DialogTitle className="text-xl font-bold">Select a Challenge</DialogTitle>
                            <p className="text-sm text-muted-foreground">Commit to a new personal growth goal.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {CHALLENGE_TEMPLATES.map(template => (
                                <Card
                                    key={template.id}
                                    onClick={() => {
                                        actions.startChallenge(template);
                                        setShowChallengeSheet(false);
                                    }}
                                    className="p-4 border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer rounded-xl flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{template.title}</h3>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                                {template.durationDays} Days
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{template.description}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </Dialog>

        </div>
    );
}
