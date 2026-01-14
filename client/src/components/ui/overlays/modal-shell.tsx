import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    badgeText?: string;
}

export function ModalShell({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    className,
    badgeText = "UI v2"
}: ModalShellProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className={cn(
                "sm:max-w-[480px] max-h-[90vh] flex flex-col p-0 gap-0 border border-white/10 bg-background/95 backdrop-blur-[20px] shadow-2xl rounded-[2.5rem] overflow-hidden text-foreground outline-none",
                className
            )}>
                <DialogHeader className="p-8 pb-4 shrink-0 border-b border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-center flex-1">
                            {title}
                        </DialogTitle>
                        {badgeText && (
                            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] tracking-widest bg-primary/5 absolute right-8 top-8">
                                {badgeText}
                            </Badge>
                        )}
                    </div>
                    {description && (
                        <DialogDescription className="text-center text-muted-foreground">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="px-8 py-4 overflow-y-auto flex-1 scrollbar-hide">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-8 pt-4 shrink-0 border-t border-white/5">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
