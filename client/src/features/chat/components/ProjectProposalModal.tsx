import { format } from "date-fns";
import { Check, Calendar as CalendarIcon, DollarSign, Clock, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Card } from "@/components/ui/card";

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
        <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="mb-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-foreground tracking-tight">${totalCost}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Cost</span>
            </Card>
            <Card className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="mb-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                    <Clock className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-foreground tracking-tight">
                    {hours}<span className="text-sm font-normal text-muted-foreground/60">h</span> {minutes > 0 && <>{minutes}<span className="text-sm font-normal text-muted-foreground/60">m</span></>}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Duration</span>
            </Card>
            <Card className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="mb-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-foreground tracking-tight">{sittings}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Sittings</span>
            </Card>
        </div>
    );

    const ProposalDatesList = () => (
        <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">SCHEDULE BREAKDOWN</span>
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{dateList.length} Sessions</span>
            </div>
            <div className="space-y-3">
                {dateList.map((dateStr, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground font-bold text-xs border border-white/10">
                            #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground">{format(new Date(dateStr), "EEEE, MMM do")}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                {format(new Date(dateStr), "h:mm a")} • {format(new Date(dateStr), "yyyy")}
                            </p>
                        </div>
                        <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap">
                            {serviceDuration}m
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const ProposalPolicies = () => (
        <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Policies & Terms</h4>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cancellation" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:bg-white/[0.02] px-2 rounded-lg py-3 text-foreground font-medium">Cancellation Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground px-2 pb-3 text-xs leading-relaxed">
                        Deposits are non-refundable. Cancellations made within 48 hours of the appointment may forfeit the deposit. Please contact the artist directly for rescheduling.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deposit" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:bg-white/[0.02] px-2 rounded-lg py-3 text-foreground font-medium">Deposit Information</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground px-2 pb-3 text-xs leading-relaxed">
                        A deposit of ${depositAmount || 0} is required to secure these dates. The remaining balance of ${totalCost - (depositAmount || 0)} is due upon completion of the service.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );

    const ProposalActions = () => (
        <div className="grid grid-cols-2 gap-3 w-full pt-2">
            {!isArtist && status === 'pending' && (
                <>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onReject}
                        disabled={isPendingAction}
                        className="h-12 border-white/10 bg-white/5 hover:bg-white/10 text-foreground hover:text-foreground font-semibold rounded-xl"
                    >
                        Decline
                    </Button>
                    <Button
                        size="lg"
                        onClick={onAccept}
                        disabled={isPendingAction}
                        className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden group border-0 shadow-lg shadow-primary/20 font-semibold rounded-xl"
                    >
                        {isPendingAction ? "Processing..." : "Accept & Continue"}
                    </Button>
                </>
            )}

            {isArtist && status === 'pending' && (
                <div className="col-span-2 flex flex-col gap-2">
                    <Button variant="secondary" className="w-full h-12 rounded-xl" disabled>
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                {/* Backdrop */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Content */}
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[101] w-full h-[100dvh] outline-none flex flex-col gap-0 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    {/* Header */}
                    <header className="px-4 py-4 z-10 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-2xl font-bold text-foreground">Project Proposal</DialogTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-foreground" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </header>

                    {/* Top Context Area */}
                    <div className="px-6 pt-4 pb-8 z-10 shrink-0 flex flex-col justify-center h-[15vh] opacity-80 transition-all duration-300">
                        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Review Details</p>
                        <p className="text-3xl font-light text-foreground/90 tracking-tight">{serviceName}</p>
                    </div>

                    {/* Sheet Container */}
                    <div className="flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative">
                        {/* Top Edge Highlight */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />

                        {/* Scrollable Content */}
                        <div className="flex-1 w-full h-full px-4 pt-8 overflow-y-auto mobile-scroll touch-pan-y">
                            <div className="pb-32 max-w-lg mx-auto space-y-4">
                                <ProposalSummary />
                                <ProposalDatesList />
                                <ProposalPolicies />
                                <ProposalActions />
                            </div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </Dialog>
    );
}
