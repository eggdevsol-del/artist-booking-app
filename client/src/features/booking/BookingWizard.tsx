
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, AlertCircle, CheckCircle2, Clock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { toast } from "sonner";

type WizardStep = 'service' | 'frequency' | 'review' | 'success';

interface BookingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: number;
    artistServices: any[]; // Ideally typed from router
    artistSettings?: any;
    onBookingSuccess: () => void;
}

export function BookingWizard({ isOpen, onClose, conversationId, artistServices, artistSettings, onBookingSuccess }: BookingWizardProps) {
    const [step, setStep] = useState<WizardStep>('service');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [frequency, setFrequency] = useState<"consecutive" | "weekly" | "biweekly" | "monthly">("consecutive");
    const [startDate] = useState(new Date());

    // -- Queries & Mutations --

    // 1. Availability Query (Only runs on Review step)
    const {
        data: availability,
        isPending: isLoadingAvailability, // Alias to keep variable name or change it
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

    // 2. Send Proposal Mutation (Send Message instead of Booking)
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
            dates: availability.dates, // Use 'dates' consistently
            proposedDates: availability.dates, // Keep for backward compat
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
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // -- Render Steps --

    const renderServiceStep = () => (
        <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Select Service</p>
            <ScrollArea className="h-[350px] pr-4 -mr-4">
                <div className="grid grid-cols-1 gap-3 pr-4">
                    {artistServices.map(service => (
                        <div
                            key={service.id}
                            className={`group relative p-5 cursor-pointer transition-all duration-300 rounded-2xl border backdrop-blur-md ${selectedService?.id === service.id
                                ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.15)] ring-1 ring-primary/30'
                                : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20 hover:from-white/15 hover:to-white/10 shadow-lg'
                                }`}
                            onClick={() => setSelectedService(service)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className={`font-bold text-lg transition-colors ${selectedService?.id === service.id ? 'text-primary' : 'text-white'}`}>
                                    {service.name}
                                </h4>
                                <span className={`font-mono text-base font-bold ${selectedService?.id === service.id ? 'text-primary' : 'text-white/80'}`}>
                                    ${service.price}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${selectedService?.id === service.id ? 'bg-primary/10 text-primary' : 'bg-black/20 text-white/60'}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {service.duration} mins
                                </span>
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${selectedService?.id === service.id ? 'bg-primary/10 text-primary' : 'bg-black/20 text-white/60'}`}>
                                    <Layers className="w-3.5 h-3.5" />
                                    {service.sittings || 1} sitting{(service.sittings || 1) > 1 ? 's' : ''}
                                </span>
                            </div>

                            {selectedService?.id === service.id && (
                                <div className="absolute right-4 bottom-4">
                                    <CheckCircle2 className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-in zoom-in spin-in-90 duration-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    const renderFrequencyStep = () => (
        <div className="space-y-6 pt-2">
            <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-lg backdrop-blur-md">
                <div>
                    <h4 className="font-bold text-white text-base">{selectedService?.name}</h4>
                    <p className="text-sm text-white/50 mt-0.5">
                        {selectedService?.sittings || 1} sittings • {selectedService?.duration} mins each
                    </p>
                </div>
                <div className="text-right">
                    <span className="block font-mono font-bold text-xl text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">${selectedService?.price}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Per Session</span>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Frequency</Label>
                <RadioGroup value={frequency} onValueChange={(v: any) => setFrequency(v)} className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'consecutive', label: 'Consecutive Days', sub: 'Best for intensive projects' },
                        { id: 'weekly', label: 'Weekly', sub: 'Same day each week' },
                        { id: 'biweekly', label: 'Bi-Weekly', sub: 'Every two weeks' },
                        { id: 'monthly', label: 'Monthly', sub: 'Once a month' }
                    ].map((opt) => (
                        <div key={opt.id} className={`group relative flex items-center space-x-4 border p-4 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${frequency === opt.id
                            ? 'bg-gradient-to-r from-primary/20 to-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                            onClick={() => setFrequency(opt.id as any)}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${frequency === opt.id ? 'border-primary' : 'border-white/20'}`}>
                                {frequency === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)]" />}
                            </div>
                            <div className="flex-1">
                                <Label htmlFor={opt.id} className={`text-sm font-bold cursor-pointer block transition-colors ${frequency === opt.id ? 'text-white' : 'text-white/80'}`}>{opt.label}</Label>
                                <p className="text-xs text-white/40 mt-0.5 font-medium">{opt.sub}</p>
                            </div>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/10 text-blue-300 rounded-2xl border border-blue-500/10 mb-2 backdrop-blur-md">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
                <p className="text-xs leading-relaxed opacity-90 font-medium">Auto-scheduler will find the best available slots starting from today based on your calendar availability.</p>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-6 pt-2">
            {isLoadingAvailability && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                        <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
                    </div>
                    <p className="text-sm font-medium text-white/50 animate-pulse">Scanning calendar for best dates...</p>
                </div>
            )}

            {availabilityError && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md">
                    <h5 className="font-bold text-red-500 flex items-center gap-2 mb-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Calculation Failed
                    </h5>
                    <p className="text-xs text-red-400/80 leading-relaxed whitespace-pre-wrap">
                        {availabilityError.message}
                    </p>
                    {availabilityError.data?.code && (
                        <div className="mt-3 inline-block px-2 py-1 bg-black/40 rounded text-[10px] font-mono text-red-500/60 border border-red-500/10">
                            Code: {availabilityError.data.code}
                        </div>
                    )}
                </div>
            )}

            {availability && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-lg">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Cost</span>
                            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">${availability.totalCost}</span>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-lg">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Sittings</span>
                            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">{selectedService?.sittings || 1}</span>
                        </div>
                    </div>

                    <div className="border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02] backdrop-blur-sm shadow-inner">
                        <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Proposed Schedule</span>
                            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-full shadow-sm border border-primary/10">{availability.dates.length} Dates</span>
                        </div>
                        <ScrollArea className="h-[220px]">
                            <div className="p-3 space-y-2">
                                {availability.dates.map((date: string | Date, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors group border border-transparent hover:border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-mono text-xs font-bold group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white/90">{format(new Date(date), "EEEE, MMMM do")}</p>
                                        </div>
                                        <div className="text-xs font-mono font-medium text-primary/90 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
                                            {format(new Date(date), "h:mm a")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 outline outline-4 outline-black/50 text-white rounded-full flex items-center justify-center shadow-2xl relative z-10">
                    <CheckCircle2 className="w-10 h-10 animate-in zoom-in spin-in-90 duration-500" />
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Proposal Sent!</h3>
                <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
                    The project proposal has been sent to the client. They will receive a notification to review and confirm dates.
                </p>
            </div>
            <Button onClick={handleClose} className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                Return to Chat
            </Button>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 gap-0 border border-white/10 bg-[#121212]/90 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden text-white outline-none">
                <DialogHeader className="p-8 pb-4 shrink-0 bg-white/[0.02]">
                    <DialogTitle className="text-xl font-bold tracking-tight text-center">
                        {step === 'service' && "Select Service"}
                        {step === 'frequency' && "Select Frequency"}
                        {step === 'review' && "Review & Send"}
                        {step === 'success' && "Success"}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-8 py-2 overflow-y-auto flex-1 scrollbar-hide">
                    {step === 'service' && renderServiceStep()}
                    {step === 'frequency' && renderFrequencyStep()}
                    {step === 'review' && renderReviewStep()}
                    {step === 'success' && renderSuccessStep()}
                </div>

                {step !== 'success' && (
                    <DialogFooter className="flex flex-row justify-between items-center p-8 pt-4 bg-white/[0.02] shrink-0 gap-4">
                        <div className="flex-1">
                            {step !== 'service' ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(prev => prev === 'review' ? 'frequency' : 'service')}
                                    className="text-white/50 hover:text-white hover:bg-white/5 -ml-4"
                                >
                                    Back
                                </Button>
                            ) : <div />}
                        </div>

                        <div className="flex-1 flex justify-end">
                            {step === 'service' && (
                                <Button
                                    disabled={!selectedService}
                                    onClick={() => setStep('frequency')}
                                    className="rounded-xl px-6 min-w-[120px] shadow-lg shadow-primary/20"
                                >
                                    Next
                                </Button>
                            )}

                            {step === 'frequency' && (
                                <Button
                                    onClick={() => setStep('review')}
                                    className="rounded-xl px-6 min-w-[120px] shadow-lg shadow-primary/20"
                                >
                                    Find Dates
                                </Button>
                            )}

                            {step === 'review' && (
                                <Button
                                    disabled={!availability || sendMessageMutation.isPending}
                                    onClick={handleConfirmBooking}
                                    className="rounded-xl px-8 min-w-[140px] shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                >
                                    {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Send Proposal
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );

}
