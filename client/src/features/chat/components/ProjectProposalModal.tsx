import { ModalShell } from "@/components/ui/overlays/modal-shell";
import { format } from "date-fns";
import { Check, Calendar as CalendarIcon, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ProposalMetadata {
    type: "project_proposal";
    serviceName: string;
    totalCost: number;
    sittings: number;
    dates: string[]; // ISO strings
    status: 'pending' | 'accepted' | 'rejected';
    serviceDuration?: number;
    depositAmount?: number;
    policies?: string[]; // Assuming policies might be passed or valid defaults
}

interface ProjectProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    metadata: ProposalMetadata | null;
    isArtist: boolean;
    onAccept: () => void;
    onReject: () => void;
    isPendingAction: boolean;
}

export function ProjectProposalModal({
    isOpen,
    onClose,
    metadata,
    isArtist,
    onAccept,
    onReject,
    isPendingAction
}: ProjectProposalModalProps) {
    if (!metadata) return null;

    const { serviceName, totalCost, sittings, dates, status, serviceDuration, depositAmount } = metadata;

    const dateList = Array.isArray(dates) ? dates : [];

    // Calculate total time
    const totalMinutes = (sittings || 1) * (serviceDuration || 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const ProposalSummary = () => (
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 mb-6">
            <div className="bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-1 ring-1 ring-primary/20">
                    <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-white">${totalCost}</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Total Cost</span>
                </div>
            </div>
            <div className="bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-white/80" />
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-white">{hours}<span className="text-sm font-normal text-white/60">h</span> {minutes > 0 && <>{minutes}<span className="text-sm font-normal text-white/60">m</span></>}</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Duration</span>
                </div>
            </div>
            <div className="bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mb-1">
                    <CalendarIcon className="w-4 h-4 text-white/80" />
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-white">{sittings}</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Sittings</span>
                </div>
            </div>
        </div>
    );

    const ProposalDatesList = () => (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Schedule Breakdown</h4>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/50 font-medium">{dateList.length} Sessions</span>
            </div>
            <div className="space-y-2">
                {dateList.map((dateStr, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex flex-col items-center justify-center flex-shrink-0 text-white/90 ring-1 ring-white/10 group-hover:bg-primary/20 group-hover:text-primary group-hover:ring-primary/30 transition-all">
                            <span className="text-[10px] font-bold uppercase opacity-80">{format(new Date(dateStr), "MMM")}</span>
                            <span className="text-lg font-bold leading-none">{format(new Date(dateStr), "d")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white/95 truncate">{format(new Date(dateStr), "EEEE")}</p>
                            <p className="text-xs text-white/50 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 opacity-70" />
                                {format(new Date(dateStr), "h:mm a")}
                                <span className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                                ~{serviceDuration} min
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/70">
                                #{i + 1}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const ProposalPolicies = () => (
        <div className="space-y-4 mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Policies & Terms</h4>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cancellation" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:bg-white/[0.02] px-2 rounded-lg py-3">Cancellation Policy</AccordionTrigger>
                    <AccordionContent className="text-white/60 px-2 pb-3">
                        Deposits are non-refundable. Cancellations made within 48 hours of the appointment may forfeit the deposit. Please contact the artist directly for rescheduling.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deposit" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:bg-white/[0.02] px-2 rounded-lg py-3">Deposit Information</AccordionTrigger>
                    <AccordionContent className="text-white/60 px-2 pb-3">
                        A deposit of ${depositAmount || 0} is required to secure these dates. The remaining balance of ${totalCost - (depositAmount || 0)} is due upon completion of the service.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );

    const ProposalActions = () => (
        <div className="grid grid-cols-2 gap-3 w-full">
            {!isArtist && status === 'pending' && (
                <>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onReject}
                        disabled={isPendingAction}
                        className="h-14 border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                    >
                        Decline
                    </Button>
                    <Button
                        size="lg"
                        onClick={onAccept}
                        disabled={isPendingAction}
                        className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden group border-0 shadow-lg shadow-primary/20"
                    >
                        {isPendingAction ? "Processing..." : "Accept & Continue"}
                    </Button>
                </>
            )}

            {isArtist && status === 'pending' && (
                <div className="col-span-2 flex flex-col gap-2">
                    <Button variant="secondary" className="w-full h-12" disabled>
                        Edit Proposal
                    </Button>
                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        Waiting for client response
                    </div>
                </div>
            )}

            {status === 'accepted' && (
                <div className="col-span-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-green-500 font-bold flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> Proposal Accepted
                    </p>
                </div>
            )}

            {status === 'rejected' && (
                <div className="col-span-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-red-500 font-bold flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Proposal Declined
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={serviceName}
            description="Review the details of this project proposal."
            overlayName="Project Proposal"
            overlayId="chat.project_proposal"
            footer={<ProposalActions />}
            className="sm:max-w-[500px]"
        >
            <div className="space-y-1">
                <ProposalSummary />
                <ProposalDatesList />
                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <ProposalPolicies />
            </div>
        </ModalShell>
    );
}
