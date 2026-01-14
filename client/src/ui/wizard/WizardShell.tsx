import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

export interface WizardStepConfig {
    id: string;
    label: string;
    render: () => React.ReactNode;
    // Footer configuration
    nextLabel?: string;
    onNext?: () => void;
    canNext?: boolean;
    isNextLoading?: boolean;
    hideNext?: boolean;
    hideBack?: boolean;
    customFooter?: React.ReactNode;
}

interface WizardShellProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    steps: WizardStepConfig[];
    currentStepIndex: number;
    onStepChange: (index: number) => void;
}

export function WizardShell({
    isOpen,
    onClose,
    steps,
    currentStepIndex,
    onStepChange
}: WizardShellProps) {
    const currentStep = steps[currentStepIndex];

    const handleNext = () => {
        if (currentStep.onNext) {
            currentStep.onNext();
        } else if (currentStepIndex < steps.length - 1) {
            onStepChange(currentStepIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            onStepChange(currentStepIndex - 1);
        }
    };

    if (!currentStep) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col p-1 gap-0 border border-white/10 bg-background/95 backdrop-blur-[20px] shadow-2xl rounded-[2.5rem] overflow-hidden text-white outline-none">

                <DialogHeader className="p-8 pb-2 shrink-0 border-b border-white/5">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-center">
                        {currentStep.label}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-8 py-2 overflow-y-auto flex-1 scrollbar-hide">
                    {currentStep.render()}
                </div>

                {!currentStep.customFooter && (
                    <DialogFooter className="flex flex-row justify-between items-center p-8 pt-4 shrink-0 gap-4">
                        <div className="flex-1">
                            {!currentStep.hideBack && currentStepIndex > 0 ? (
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="text-white/50 hover:text-white hover:bg-white/5 -ml-4 font-bold"
                                >
                                    Back
                                </Button>
                            ) : <div />}
                        </div>

                        <div className="flex-1 flex justify-end">
                            {!currentStep.hideNext && (
                                <Button
                                    disabled={!currentStep.canNext || currentStep.isNextLoading}
                                    onClick={handleNext}
                                    className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all w-full sm:w-auto"
                                >
                                    {currentStep.isNextLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                                    {currentStep.nextLabel || "Next"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
                {currentStep.customFooter && currentStep.customFooter}
            </DialogContent>
        </Dialog>
    );
}
