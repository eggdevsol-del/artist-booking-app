import { format } from "date-fns";
import { Check, X, Calendar as CalendarIcon, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProposedDate {
    date: string; // ISO string
}

interface ProposalMetadata {
    type: "project_proposal";
    serviceName: string;
    totalCost: number;
    sittings: number;
    dates: string[]; // ISO strings
    status: 'pending' | 'accepted' | 'rejected';
    serviceDuration?: number;
}

interface ProjectProposalMessageProps {
    metadata: ProposalMetadata;
    isArtist: boolean;
    onAccept: () => void;
    onReject: () => void;
    isPendingAction: boolean;
}

export function ProjectProposalMessage({
    metadata,
    isArtist,
    onAccept,
    onReject,
    isPendingAction
}: ProjectProposalMessageProps) {
    const { serviceName, totalCost, sittings, dates, status, serviceDuration } = metadata;

    // Ensure dates is an array
    const dateList = Array.isArray(dates) ? dates : [];

    // Calculate total time
    const totalMinutes = (sittings || 1) * (serviceDuration || 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeDisplay = `${hours} Hrs${minutes > 0 ? ` / ${minutes} min` : ''}`;

    return (
        <Card className="w-[85vw] max-w-[400px] border border-white/10 bg-black/40 backdrop-blur-xl text-white shadow-2xl overflow-hidden rounded-[2rem] self-center ring-1 ring-white/5">
            {/* Header with Gradient Accent */}
            <div className="relative p-6 pb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />

                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Project Proposal</span>
                        </div>
                        <h3 className="font-bold text-xl text-white tracking-tight">{serviceName}</h3>
                    </div>
                    <div>
                        {status === 'pending' && (
                            <div className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-amber-500/20 shadow-sm backdrop-blur-md">
                                Pending
                            </div>
                        )}
                        {status === 'accepted' && (
                            <div className="bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-green-500/20 shadow-sm backdrop-blur-md flex items-center gap-1">
                                <Check className="w-3 h-3" /> Accepted
                            </div>
                        )}
                        {status === 'rejected' && (
                            <div className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-red-500/20 shadow-sm backdrop-blur-md">
                                Declined
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CardContent className="p-6 pt-0 grid gap-6">
                {/* Stats Row - Glass Container */}
                <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                    <div className="bg-white/[0.02] p-3 flex flex-col items-center justify-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1">
                            <DollarSign className="w-4 h-4 text-white/90" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-base text-white">${totalCost}</span>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Total</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.02] p-3 flex flex-col items-center justify-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1">
                            <Clock className="w-4 h-4 text-white/90" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-base text-white">{hours}<span className="text-xs font-normal text-white/70">h</span></span>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Time</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.02] p-3 flex flex-col items-center justify-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1">
                            <CalendarIcon className="w-4 h-4 text-white/90" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-base text-white">{sittings}</span>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Sittings</span>
                        </div>
                    </div>
                </div>

                {/* Dates List */}
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-1">Proposed Schedule</p>
                    <div className="space-y-2">
                        {dateList.map((dateStr, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex flex-col items-center justify-center flex-shrink-0 text-white/90 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <span className="text-[10px] font-bold uppercase">{format(new Date(dateStr), "MMM")}</span>
                                    <span className="text-sm font-bold">{format(new Date(dateStr), "d")}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-white/90 truncate">{format(new Date(dateStr), "EEEE")}</p>
                                    <p className="text-xs text-white/50">{format(new Date(dateStr), "h:mm a")}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-white/90 inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                        <span className="w-1 h-1 rounded-full bg-white/30" />
                                        Session {i + 1}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Actions Footer */}
            {!isArtist && status === 'pending' && (
                <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-white/[0.02]">
                    <button
                        onClick={onReject}
                        disabled={isPendingAction}
                        className="py-4 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all active:bg-white/10"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={isPendingAction}
                        className="py-4 text-sm font-bold text-primary hover:text-primary/90 hover:bg-primary/5 disabled:opacity-50 transition-all active:bg-primary/10 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isPendingAction ? (
                                "Accepting..."
                            ) : (
                                <><span>Accept Proposal</span> <Check className="w-4 h-4" /></>
                            )}
                        </span>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            )}

            {isArtist && status === 'pending' && (
                <div className="py-3 px-6 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[10px] text-white/40 italic flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                        Waiting for client confirmation
                    </p>
                </div>
            )}

            {/* Deposit Info for Accepted Status */}
            {status === 'accepted' && (metadata as any).autoSendDeposit && (
                <div className="px-6 pb-6 pt-0">
                    <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-green-500 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            Next Steps: Deposit
                        </h4>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-green-400/90 py-0.5 border-b border-green-500/10 pb-1 mb-1">
                                <span className="opacity-70">Amount Due</span>
                                <span className="font-bold">${(metadata as any).depositAmount}</span>
                            </div>
                            <div className="text-[10px] space-y-1 text-green-400/70">
                                {(metadata as any).bsb && <div className="flex justify-between"><span>BSB</span> <span className="font-mono text-green-400/90">{(metadata as any).bsb}</span></div>}
                                {(metadata as any).accountNumber && <div className="flex justify-between"><span>Account</span> <span className="font-mono text-green-400/90">{(metadata as any).accountNumber}</span></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
