import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, AlertCircle, CheckCircle2, Clock, Layers, ChevronRight, Check, X, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WizardStep = 'service' | 'frequency' | 'review' | 'success';

interface BookingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: number;
    artistServices: any[];
    artistSettings?: any;
    onBookingSuccess: () => void;
    overlayName?: string;
    overlayId?: string;
}

export function BookingWizard({ isOpen, onClose, conversationId, artistServices, artistSettings, onBookingSuccess, overlayName, overlayId }: BookingWizardProps) {
    const [step, setStep] = useState<WizardStep>('service');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [frequency, setFrequency] = useState<"consecutive" | "weekly" | "biweekly" | "monthly">("consecutive");
    const [startDate] = useState(new Date());

    // -- Queries & Mutations --

    // 1. Availability Query (Only runs on Review step)
    const {
        data: availability,
        isPending: isLoadingAvailability,
        error: availabilityError
    } = trpc.booking.checkAvailability.useQuery({
        conversationId,
        serviceName: selectedService?.name || '',
        serviceDuration: selectedService?.duration || 60,
        sittings: selectedService?.sittings || 1,
        price: Number(selectedService?.price) || 0,
        frequency,
        startDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }, {
        enabled: isOpen && step === 'review' && !!selectedService,
        retry: false,
    });

    // 2. Send Proposal Mutation
    const utils = trpc.useUtils();
    const sendMessageMutation = trpc.messages.send.useMutation({
        onSuccess: () => {
            utils.messages.list.invalidate({ conversationId });
            toast.success("Proposal Sent Successfully");
            handleClose();
            onBookingSuccess();
        },
        onError: (err) => {
            toast.error("Failed to send proposal: " + err.message);
        }
    });

    // -- Handlers --

    const handleConfirmBooking = () => {
        if (!availability?.dates || !selectedService) return;

        const datesList = availability.dates
            .map((date: string | Date) => format(new Date(date), 'EEEE, MMMM do yyyy, h:mm a'))
            .join('\n');

        const message = `I have found the following dates for your ${selectedService.name} project:\n\n${datesList}\n\nThis project consists of ${selectedService.sittings || 1} sittings.\nFrequency: ${frequency}\nPrice per sitting: $${selectedService.price}\n\nPlease confirm these dates.`;

        const totalCost = Number(selectedService.price) * (selectedService.sittings || 1);

        const metadata = JSON.stringify({
            type: "project_proposal",
            serviceName: selectedService.name,
            serviceDuration: selectedService.duration,
            sittings: selectedService.sittings || 1,
            price: Number(selectedService.price),
            totalCost: totalCost,
            frequency: frequency,
            dates: availability.dates,
            proposedDates: availability.dates,
            status: 'pending',
            bsb: artistSettings?.bsb,
            accountNumber: artistSettings?.accountNumber,
            depositAmount: artistSettings?.depositAmount,
            autoSendDeposit: artistSettings?.autoSendDepositInfo
        });

        sendMessageMutation.mutate({
            conversationId,
            content: message,
            messageType: "appointment_request",
            metadata: metadata
        });
    };

    const reset = () => {
        setStep('service');
        setSelectedService(null);
        setFrequency("consecutive");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const goBack = () => {
        if (step === 'frequency') setStep('service');
        if (step === 'review') setStep('frequency');
    };

    // -- Header Titles --
    const getStepTitle = () => {
        switch (step) {
            case 'service': return "Select Service";
            case 'frequency': return "Select Frequency";
            case 'review': return "Review Proposal";
            case 'success': return "Proposal Sent";
        }
    };

    // -- Render Content --

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* Full Screen Modal Shell */}
            <DialogContent
                className="fixed inset-0 z-[100] w-full h-[100dvh] max-w-none rounded-none border-none p-0 bg-background outline-none flex flex-col gap-0 overflow-hidden sm:max-w-none"
                style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}
            >

                {/* 1. Page Header (Fixed) */}
                <header className="px-4 py-4 z-10 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {step !== 'service' && step !== 'success' && (
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-foreground" onClick={goBack}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <DialogTitle className="text-2xl font-bold text-foreground">{getStepTitle()}</DialogTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-foreground" onClick={handleClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </header>

                {/* 2. Top Context Area (Summary of progress) */}
                <div className="px-6 pt-4 pb-8 z-10 shrink-0 flex flex-col justify-center h-[15vh] opacity-80 transition-all duration-300">
                    {step === 'service' && <p className="text-4xl font-light text-foreground/90 tracking-tight">Booking</p>}
                    {step === 'frequency' && (
                        <div>
                            <p className="text-lg font-bold text-primary">{selectedService?.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedService?.duration}min • ${selectedService?.price}</p>
                        </div>
                    )}
                    {step === 'review' && (
                        <div>
                            <p className="text-4xl font-light text-foreground/90 tracking-tight">Summary</p>
                            <p className="text-sm text-muted-foreground mt-1">{frequency} • {selectedService?.name}</p>
                        </div>
                    )}
                    {step === 'success' && <p className="text-4xl font-light text-foreground/90 tracking-tight">Done</p>}
                </div>

                {/* 3. Sheet Container */}
                <div className="flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative">
                    {/* Top Edge Highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />

                    {/* Scrollable Content */}
                    <div className="flex-1 w-full h-full px-4 pt-8 overflow-y-auto mobile-scroll touch-pan-y">
                        <div className="pb-32 max-w-lg mx-auto space-y-4">

                            {/* STEP: SERVICE */}
                            {step === 'service' && (
                                <div className="space-y-3">
                                    {artistServices.map(service => (
                                        <div
                                            key={service.id}
                                            className={cn(
                                                "p-4 border rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-between group",
                                                selectedService?.id === service.id
                                                    ? "bg-primary/10 border-primary/50"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                            )}
                                            onClick={() => {
                                                setSelectedService(service);
                                                setTimeout(() => setStep('frequency'), 200);
                                            }}
                                        >
                                            <div className="flex-1">
                                                <h3 className={cn("font-semibold text-base transition-colors", selectedService?.id === service.id ? "text-primary" : "text-foreground group-hover:text-foreground")}>
                                                    {service.name}
                                                </h3>
                                                <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-mono">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}m</span>
                                                    <span className={cn("font-bold", selectedService?.id === service.id ? "text-primary/80" : "text-primary")}>${service.price}</span>
                                                    <span>• {service.sittings || 1} sitting{(service.sittings || 1) > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                                                selectedService?.id === service.id
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "bg-transparent border-white/20 text-transparent group-hover:border-white/40"
                                            )}>
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* STEP: FREQUENCY */}
                            {step === 'frequency' && (
                                <div className="space-y-6">
                                    <RadioGroup value={frequency} onValueChange={(v: any) => setFrequency(v)} className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'consecutive', label: 'Consecutive Days', sub: 'Best for intensive projects' },
                                            { id: 'weekly', label: 'Weekly', sub: 'Same day each week' },
                                            { id: 'biweekly', label: 'Bi-Weekly', sub: 'Every two weeks' },
                                            { id: 'monthly', label: 'Monthly', sub: 'Once a month' }
                                        ].map((opt) => (
                                            <div
                                                key={opt.id}
                                                className={cn(
                                                    "p-4 border rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-between group",
                                                    frequency === opt.id
                                                        ? "bg-primary/10 border-primary/50"
                                                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                                )}
                                                onClick={() => setFrequency(opt.id as any)}
                                            >
                                                <div className="flex-1">
                                                    <h3 className={cn("font-semibold text-base transition-colors", frequency === opt.id ? "text-primary" : "text-foreground")}>{opt.label}</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                                                </div>

                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    frequency === opt.id ? "border-primary" : "border-white/20 group-hover:border-white/40"
                                                )}>
                                                    {frequency === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                </div>
                                            </div>
                                        ))}
                                    </RadioGroup>

                                    <Button
                                        className="w-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
                                        onClick={() => setStep('review')}
                                    >
                                        Find Available Dates
                                    </Button>
                                </div>
                            )}

                            {/* STEP: REVIEW */}
                            {step === 'review' && (
                                <div className="space-y-6">
                                    {isLoadingAvailability && (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Scanning calendar...</p>
                                        </div>
                                    )}

                                    {availabilityError && (
                                        <Card className="p-5 bg-destructive/10 border-0 rounded-2xl">
                                            <h5 className="font-bold text-destructive flex items-center gap-2 mb-2 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                Calculation Failed
                                            </h5>
                                            <p className="text-xs text-destructive/80 leading-relaxed">
                                                {availabilityError.message}
                                            </p>
                                        </Card>
                                    )}

                                    {availability && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TOTAL COST</span>
                                                    <span className="text-2xl font-bold text-foreground tracking-tight">${availability.totalCost}</span>
                                                </div>
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">SITTINGS</span>
                                                    <span className="text-2xl font-bold text-foreground tracking-tight">{selectedService?.sittings || 1}</span>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">PROPOSED SCHEDULE</span>
                                                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{availability.dates.length} Dates</span>
                                                </div>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {availability.dates.map((date: string | Date, i: number) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground font-bold text-xs">
                                                                {i + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-foreground">{format(new Date(date), "EEEE, MMM do")}</p>
                                                                <p className="text-xs text-muted-foreground">{format(new Date(date), "yyyy")}</p>
                                                            </div>
                                                            <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                                {format(new Date(date), "h:mm a")}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
                                                onClick={handleConfirmBooking}
                                                disabled={sendMessageMutation.isPending}
                                            >
                                                {sendMessageMutation.isPending ? "Sending..." : "Send Proposal"}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* STEP: SUCCESS */}
                            {step === 'success' && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle2 className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Proposal Sent!</h3>
                                        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                                            The project proposal has been sent to the client.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleClose}
                                        className="w-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
                                    >
                                        Return to Chat
                                    </Button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
