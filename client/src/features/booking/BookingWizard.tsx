
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, AlertCircle, CheckCircle2, Clock, Layers, ChevronRight, Check } from "lucide-react";
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
        <div className="space-y-4 pt-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#5b4eff]/80 mb-4 pl-1">SELECT SERVICE</p>
            <ScrollArea className="h-[380px] pr-4 -mr-4">
                <div className="grid grid-cols-1 gap-4 pr-4">
                    {artistServices.map(service => (
                        <div
                            key={service.id}
                            className={`group relative p-6 cursor-pointer transition-all duration-300 rounded-[2rem] border ${selectedService?.id === service.id
                                ? 'bg-[#5b4eff]/10 border-[#5b4eff] shadow-[0_0_30px_rgba(91,78,255,0.15)]'
                                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-white/5 hover:border-white/10 hover:bg-[#222]/90'
                                }`}
                            onClick={() => setSelectedService(service)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className={`font-bold text-xl mb-1 ${selectedService?.id === service.id ? 'text-[#a5a0ff]' : 'text-white'}`}>
                                        {service.name}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0a0a0a] text-white/50 text-xs font-medium border border-white/5">
                                            <Clock className="w-3 h-3" />
                                            {service.duration} mins
                                        </span>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0a0a0a] text-white/50 text-xs font-medium border border-white/5">
                                            <Layers className="w-3 h-3" />
                                            {service.sittings || 1} sitting{(service.sittings || 1) > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-bold text-lg text-[#5b4eff]">
                                    ${service.price}
                                </span>
                            </div>

                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center absolute bottom-6 right-6 transition-colors ${selectedService?.id === service.id ? 'border-[#5b4eff] bg-[#5b4eff]' : 'border-white/20'}`}>
                                {selectedService?.id === service.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    const renderFrequencyStep = () => (
        <div className="space-y-6 pt-2">
            <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 p-6 rounded-[2rem] flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-white text-lg">{selectedService?.name}</h4>
                    <p className="text-sm text-white/50 mt-1">
                        {selectedService?.sittings || 1} sittings • {selectedService?.duration} mins each
                    </p>
                </div>
                <div className="text-right">
                    <span className="block font-bold text-2xl text-[#5b4eff]">${selectedService?.price}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">PER SESSION</span>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">FREQUENCY</Label>
                <RadioGroup value={frequency} onValueChange={(v: any) => setFrequency(v)} className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'consecutive', label: 'Consecutive Days', sub: 'Best for intensive projects' },
                        { id: 'weekly', label: 'Weekly', sub: 'Same day each week' },
                        { id: 'biweekly', label: 'Bi-Weekly', sub: 'Every two weeks' },
                        { id: 'monthly', label: 'Monthly', sub: 'Once a month' }
                    ].map((opt) => (
                        <div key={opt.id} className={`group relative flex items-center space-x-4 border p-5 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${frequency === opt.id
                            ? 'bg-[#5b4eff]/10 border-[#5b4eff] shadow-[0_0_15px_rgba(91,78,255,0.1)]'
                            : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-white/5 hover:bg-[#222]/90'
                            }`}
                            onClick={() => setFrequency(opt.id as any)}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${frequency === opt.id ? 'border-[#5b4eff]' : 'border-white/20 ml-1'}`}>
                                {frequency === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#5b4eff]" />}
                            </div>
                            <div className="flex-1">
                                <Label htmlFor={opt.id} className={`text-base font-bold cursor-pointer block transition-colors ${frequency === opt.id ? 'text-white' : 'text-white/70'}`}>{opt.label}</Label>
                                <p className="text-xs text-white/40 mt-1 font-medium">{opt.sub}</p>
                            </div>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-6 pt-2">
            {isLoadingAvailability && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4eff]" />
                    <p className="text-sm font-medium text-white/50 animate-pulse">Scanning calendar...</p>
                </div>
            )}

            {availabilityError && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <h5 className="font-bold text-red-500 flex items-center gap-2 mb-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Calculation Failed
                    </h5>
                    <p className="text-xs text-red-400/80 leading-relaxed">
                        {availabilityError.message}
                    </p>
                </div>
            )}

            {availability && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-[#1a1a1a] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">TOTAL COST</span>
                            <span className="text-3xl font-bold text-white tracking-tight">${availability.totalCost}</span>
                        </div>
                        <div className="p-6 bg-[#1a1a1a] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">SITTINGS</span>
                            <span className="text-3xl font-bold text-white tracking-tight">{selectedService?.sittings || 1}</span>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] overflow-hidden p-6 pb-2">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/40">PROPOSED SCHEDULE</span>
                            <span className="text-[10px] font-bold bg-[#5b4eff]/20 text-[#7c74ff] px-3 py-1 rounded-full">{availability.dates.length} Dates</span>
                        </div>
                        <ScrollArea className="h-[210px] pr-2 -mr-2">
                            <div className="space-y-4 pb-4">
                                {availability.dates.map((date: string | Date, i: number) => (
                                    <div key={i} className="flex items-center gap-5 group">
                                        <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-white/30 font-bold text-sm group-hover:text-[#5b4eff] group-hover:border-[#5b4eff]/50 transition-colors">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-bold text-white">{format(new Date(date), "EEEE,")}</p>
                                            <p className="text-base font-bold text-white">{format(new Date(date), "MMMM do")}</p>
                                        </div>
                                        <div className="text-xs font-bold text-[#b4b0ff] bg-[#5b4eff]/10 px-3 py-1.5 rounded-full border border-[#5b4eff]/20">
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
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white tracking-tight">Proposal Sent!</h3>
                <p className="text-white/50 text-base max-w-xs mx-auto leading-relaxed">
                    The project proposal has been sent to the client.
                </p>
            </div>
            <Button onClick={handleClose} className="w-full h-14 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 mt-4">
                Return to Chat
            </Button>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col p-1 gap-0 border border-white/10 bg-background/95 backdrop-blur-[20px] shadow-2xl rounded-[2.5rem] overflow-hidden text-white outline-none">
                <DialogHeader className="p-8 pb-2 shrink-0 border-b border-white/5">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-center">
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
                    <DialogFooter className="flex flex-row justify-between items-center p-8 pt-4 shrink-0 gap-4">
                        <div className="flex-1">
                            {step !== 'service' ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(prev => prev === 'review' ? 'frequency' : 'service')}
                                    className="text-white/50 hover:text-white hover:bg-white/5 -ml-4 font-bold"
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
                                    className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    Next
                                </Button>
                            )}

                            {step === 'frequency' && (
                                <Button
                                    onClick={() => setStep('review')}
                                    className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 transition-all"
                                >
                                    Find Dates
                                </Button>
                            )}

                            {step === 'review' && (
                                <Button
                                    disabled={!availability || sendMessageMutation.isPending}
                                    onClick={handleConfirmBooking}
                                    className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all w-full sm:w-auto"
                                >
                                    {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
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
