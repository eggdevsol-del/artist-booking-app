import { format } from "date-fns";
import { Check, X, Calendar as CalendarIcon, DollarSign, Clock, ArrowRight } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
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
    autoSendDeposit?: boolean;
    depositAmount?: number;
    bsb?: string;
    accountNumber?: string;
}

interface ProjectProposalMessageProps {
    metadata: ProposalMetadata;
    isArtist: boolean;
    onViewDetails: () => void;
}

export function ProjectProposalMessage({
    metadata,
    isArtist,
    onViewDetails
}: ProjectProposalMessageProps) {
    const { serviceName, totalCost, sittings, dates, status, serviceDuration } = metadata;

    // Calculate total time
    const totalMinutes = (sittings || 1) * (serviceDuration || 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeDisplay = `${hours} Hrs${minutes > 0 ? ` / ${minutes} min` : ''}`;

    return (
        <Card
            className="w-[85vw] max-w-[360px] border border-white/10 bg-black/40 backdrop-blur-xl text-white shadow-2xl overflow-hidden rounded-[1.5rem] self-center ring-1 ring-white/5 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={onViewDetails}
        >
            {/* Header with Gradient Accent */}
            <div className="relative p-5 pb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />

                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Project Proposal</span>
                        </div>
                        <h3 className="font-bold text-lg text-white tracking-tight leading-time">{serviceName}</h3>
                    </div>
                </div>
            </div>

            <CardContent className="p-5 pt-0 grid gap-4">
                {/* Stats Row - Glass Container */}
                <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
                    <div className="bg-white/[0.02] p-2.5 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Total</span>
                        <span className="block font-bold text-sm text-white">${totalCost}</span>
                    </div>
                    <div className="bg-white/[0.02] p-2.5 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Time</span>
                        <span className="block font-bold text-sm text-white">{hours}<span className="text-[10px] font-normal text-white/70">h</span></span>
                    </div>
                    <div className="bg-white/[0.02] p-2.5 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Sittings</span>
                        <span className="block font-bold text-sm text-white">{sittings}</span>
                    </div>
                </div>

                {/* Status / Call to Action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {status === 'pending' && (
                            <div className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-amber-500/20 backdrop-blur-md">
                                Pending Action
                            </div>
                        )}
                        {status === 'accepted' && (
                            <div className="bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-green-500/20 backdrop-blur-md flex items-center gap-1">
                                <Check className="w-3 h-3" /> Accepted
                            </div>
                        )}
                        {status === 'rejected' && (
                            <div className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-red-500/20 backdrop-blur-md">
                                Declined
                            </div>
                        )}
                    </div>

                    <div className="text-primary text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                        View Details <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
