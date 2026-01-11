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
    const { serviceName, totalCost, sittings, dates, status } = metadata;

    // Ensure dates is an array
    const dateList = Array.isArray(dates) ? dates : [];

    return (
        <Card className="w-full max-w-[320px] shadow-sm border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
            <CardHeader className="pb-2 space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-primary">Project Proposal</CardTitle>
                    {status === 'accepted' && <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Accepted</span>}
                    {status === 'rejected' && <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>}
                    {status === 'pending' && <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>}
                </div>
                <CardDescription className="text-xs font-medium text-foreground/80">{serviceName}</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 pb-3">
                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>${totalCost}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{sittings} Sitting{sittings !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Dates List */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Proposed Dates</span>
                    </div>
                    <div className="grid gap-1 max-h-[120px] overflow-y-auto pr-1">
                        {dateList.map((dateStr, i) => (
                            <div key={i} className="text-xs bg-muted/30 px-2 py-1.5 rounded flex items-center justify-between">
                                <span>{format(new Date(dateStr), "EEE, MMM d, yyyy")}</span>
                                <span className="text-muted-foreground">{format(new Date(dateStr), "h:mm a")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Client Actions */}
            {!isArtist && status === 'pending' && (
                <CardFooter className="pt-0 grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={onReject}
                        disabled={isPendingAction}
                    >
                        Decline
                    </Button>
                    <Button
                        size="sm"
                        className="w-full text-xs h-8 bg-primary hover:bg-primary/90"
                        onClick={onAccept}
                        disabled={isPendingAction}
                    >
                        {isPendingAction ? "Accepting..." : "Accept"}
                    </Button>
                </CardFooter>
            )}

            {isArtist && status === 'pending' && (
                <CardFooter className="pt-0">
                    <p className="text-[10px] text-center w-full text-muted-foreground italic">
                        Waiting for client response...
                    </p>
                </CardFooter>
            )}

            {/* Deposit Info (Only if accepted and info exists) */}
            {status === 'accepted' && (metadata as any).autoSendDeposit && (
                <CardFooter className="pt-0 block">
                    <div className="bg-muted/50 p-2 rounded-md border border-border/50">
                        <h4 className="text-xs font-semibold mb-1">Deposit Information</h4>
                        <div className="text-[10px] space-y-0.5 text-muted-foreground">
                            {(metadata as any).depositAmount ? <p>Amount: ${(metadata as any).depositAmount}</p> : null}
                            {(metadata as any).bsb ? <p>BSB: {(metadata as any).bsb}</p> : null}
                            {(metadata as any).accountNumber ? <p>Acc: {(metadata as any).accountNumber}</p> : null}
                            {!(metadata as any).bsb && !(metadata as any).accountNumber && <p>Please contact artist for details.</p>}
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
