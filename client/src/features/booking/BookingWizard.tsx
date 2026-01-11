
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";

type WizardStep = 'service' | 'frequency' | 'review' | 'success';

interface BookingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: number;
    artistServices: any[]; // Ideally typed from router
    onBookingSuccess: () => void;
}

export function BookingWizard({ isOpen, onClose, conversationId, artistServices, onBookingSuccess }: BookingWizardProps) {
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
    }, {
        enabled: isOpen && step === 'review' && !!selectedService,
        retry: false,
    });

    // 2. Booking Mutation
    const bookProjectMutation = trpc.booking.bookProject.useMutation({
        onSuccess: () => {
            setStep('success');
            onBookingSuccess();
        }
    });

    // -- Handlers --

    const handleConfirmBooking = () => {
        if (!availability?.dates || !selectedService) return;

        const appointments = availability.dates.map((date: string | Date, index: number) => {
            const startDate = new Date(date);
            const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
            return {
                startTime: startDate,
                endTime: endDate,
                title: `${selectedService.name} (${index + 1}/${selectedService.sittings})`,
                description: `Project Sitting ${index + 1}`,
                serviceName: selectedService.name,
                price: Number(selectedService.price),
                depositAmount: 0 // Could calculated based on policy
            };
        });

        bookProjectMutation.mutate({
            conversationId,
            appointments
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
            <p className="text-sm text-muted-foreground">Select a service to start the project booking.</p>
            <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 gap-3">
                    {artistServices.map(service => (
                        <Card
                            key={service.id}
                            className={`p-4 cursor-pointer transition-all hover:bg-accent ${selectedService?.id === service.id ? 'border-primary bg-accent/50' : ''}`}
                            onClick={() => setSelectedService(service)}
                        >
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{service.name}</h4>
                                <span className="font-mono text-sm">${service.price} / sitting</span>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {service.duration} mins</span>
                                <span>•</span>
                                <span>{service.sittings || 1} sitting{(service.sittings || 1) > 1 ? 's' : ''}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    const renderFrequencyStep = () => (
        <div className="space-y-6 py-4">
            <div className="bg-accent/30 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{selectedService?.name}</h4>
                <p className="text-xs text-muted-foreground">
                    {selectedService?.sittings || 1} sittings • {selectedService?.duration} mins each
                </p>
            </div>

            <div className="space-y-3">
                <Label>How often should sittings occur?</Label>
                <RadioGroup value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/20">
                        <RadioGroupItem value="consecutive" id="r1" />
                        <Label htmlFor="r1" className="cursor-pointer flex-1">Consecutive Days</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/20">
                        <RadioGroupItem value="weekly" id="r2" />
                        <Label htmlFor="r2" className="cursor-pointer flex-1">Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/20">
                        <RadioGroupItem value="biweekly" id="r3" />
                        <Label htmlFor="r3" className="cursor-pointer flex-1">Bi-Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/20">
                        <RadioGroupItem value="monthly" id="r4" />
                        <Label htmlFor="r4" className="cursor-pointer flex-1">Monthly</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-400 rounded-md text-xs">
                <AlertCircle className="w-4 h-4" />
                <p>Allow the system to automatically find the best dates starting from today.</p>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-4">
            {isLoadingAvailability && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Calculating best available dates...</p>
                </div>
            )}

            {availabilityError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <h5 className="font-semibold text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Calculation Failed
                    </h5>
                    <p className="text-sm text-destructive mt-2 whitespace-pre-wrap">
                        {availabilityError.message}
                    </p>
                    <div className="mt-4 p-2 bg-black/20 rounded text-xs font-mono text-destructive/80">
                        Debug: {availabilityError.data?.code}
                    </div>
                </div>
            )}

            {availability && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-secondary/50 rounded-lg border">
                            <span className="text-xs text-muted-foreground block mb-1">Total Project Cost</span>
                            <span className="text-lg font-bold">${availability.totalCost}</span>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-lg border">
                            <span className="text-xs text-muted-foreground block mb-1">Total Sittings</span>
                            <span className="text-lg font-bold">{selectedService?.sittings || 1}</span>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <div className="bg-muted/50 p-2 border-b text-xs font-semibold uppercase tracking-wider px-4">
                            Proposed Schedule
                        </div>
                        <ScrollArea className="h-[200px]">
                            <div className="p-2 space-y-1">
                                {availability.dates.map((date: string | Date, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded text-sm">
                                        <span className="text-muted-foreground font-mono w-6">{i + 1}.</span>
                                        <span className="font-medium">{format(new Date(date), "EEEE, MMMM do")}</span>
                                        <span className="text-muted-foreground">{format(new Date(date), "h:mm a")}</span>
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
        <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-xl font-bold">Booking Proposal Sent!</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                    The project dates have been proposed to the client. They will need to confirm before the booking is finalized.
                </p>
            </div>
            <Button onClick={handleClose} className="w-full">Return to Chat</Button>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'service' && "Select Service"}
                        {step === 'frequency' && "Select Frequency"}
                        {step === 'review' && "Review & Send"}
                        {step === 'success' && "Success"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2">
                    {step === 'service' && renderServiceStep()}
                    {step === 'frequency' && renderFrequencyStep()}
                    {step === 'review' && renderReviewStep()}
                    {step === 'success' && renderSuccessStep()}
                </div>

                {step !== 'success' && (
                    <DialogFooter className="flex justify-between sm:justify-between px-0">
                        {step !== 'service' ? (
                            <Button variant="ghost" onClick={() => setStep(prev => prev === 'review' ? 'frequency' : 'service')}>
                                Back
                            </Button>
                        ) : <div />}

                        {step === 'service' && (
                            <Button disabled={!selectedService} onClick={() => setStep('frequency')}>
                                Next: Frequency
                            </Button>
                        )}

                        {step === 'frequency' && (
                            <Button onClick={() => setStep('review')}>
                                Find Dates
                            </Button>
                        )}

                        {step === 'review' && (
                            <Button
                                disabled={!availability || bookProjectMutation.isPending}
                                onClick={handleConfirmBooking}
                            >
                                {bookProjectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Send Proposal
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );

}
