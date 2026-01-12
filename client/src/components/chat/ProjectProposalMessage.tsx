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
    serviceDuration?: number;
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
    const { serviceName, totalCost, sittings, dates, status, serviceDuration } = metadata;

    // Ensure dates is an array
    const dateList = Array.isArray(dates) ? dates : [];

    // Calculate total time
    const totalMinutes = (sittings || 1) * (serviceDuration || 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeDisplay = `${hours} Hrs${minutes > 0 ? ` / ${minutes} min` : ''}`;

    return (
        <Card className="w-full max-w-[340px] border-none bg-[#1a1a1a] text-white shadow-xl overflow-hidden">
            {/* Header / Status */}
            <div className="p-5 pb-2 flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-[#9d8ec4]">Project Proposal</h3>
                    <p className="text-sm font-medium text-gray-300">{serviceName}</p>
                </div>
                <div>
                    {status === 'pending' && <span className="bg-amber-500/20 text-amber-500 text-xs px-3 py-1 rounded-full font-medium">Pending</span>}
                    {status === 'accepted' && <span className="bg-green-500/20 text-green-500 text-xs px-3 py-1 rounded-full font-medium">Accepted</span>}
                    {status === 'rejected' && <span className="bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full font-medium">Rejected</span>}
                </div>
            </div>

            <CardContent className="p-5 pt-2 grid gap-5">
                {/* Stats Row */}
                <div className="bg-[#242424] rounded-xl p-3 flex items-center justify-between text-sm mx-auto w-full">
                    <div className="flex-1 text-center border-r border-gray-700">
                        <span className="block font-semibold text-gray-200">${totalCost}</span>
                    </div>
                    <div className="flex-[1.5] text-center border-r border-gray-700 px-2">
                        <span className="block font-medium text-gray-400 text-xs">{timeDisplay} / {totalMinutes} min</span>
                    </div>
                    <div className="flex-1 text-center">
                        <span className="block font-medium text-gray-400 text-xs">{sittings} Sittings</span>
                    </div>
                </div>

                {/* Dates List */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Proposed Dates</span>
                    </div>
                    <div className="space-y-2">
                        {dateList.map((dateStr, i) => (
                            <div key={i} className="flex items-center justify-between text-sm text-gray-300">
                                <span className="font-medium">{format(new Date(dateStr), "EEE, MMM d, yyyy")}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500">{format(new Date(dateStr), "h:mm a")}</span>
                                    <span className="text-gray-500 text-xs">${(totalCost / sittings).toFixed(0)}</span>
                                </div>
                            </div>
                        ))}
                        <div className="pt-2">
                            <p className="text-[10px] text-gray-600 italic">Waiting for client response...</p>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Client Actions */}
            {!isArtist && status === 'pending' && (
                <div className="grid grid-cols-2 gap-px bg-gray-800/50 mt-2">
                    <button
                        onClick={onReject}
                        disabled={isPendingAction}
                        className="py-3 text-sm font-medium text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={isPendingAction}
                        className="py-3 text-sm font-medium text-[#9d8ec4] hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                        {isPendingAction ? "Accepting..." : "Accept"}
                    </button>
                </div>
            )}
            {/* Artist Status Footer */}
            {isArtist && status === 'pending' && (
                <div className="bg-gray-800/30 py-2 text-center">
                    <p className="text-[10px] text-gray-500">Proposal sent. Waiting for client confirmation.</p>
                </div>
            )}

            {/* Deposit Info (Only if accepted and info exists) */}
            {status === 'accepted' && (metadata as any).autoSendDeposit && (
                <div className="p-4 pt-0">
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/10">
                        <h4 className="text-xs font-semibold text-green-500 mb-1">Deposit Information</h4>
                        <div className="text-[10px] space-y-0.5 text-green-400/80">
                            {(metadata as any).depositAmount ? <p>Amount: ${(metadata as any).depositAmount}</p> : null}
                            {(metadata as any).bsb ? <p>BSB: {(metadata as any).bsb}</p> : null}
                            {(metadata as any).accountNumber ? <p>Acc: {(metadata as any).accountNumber}</p> : null}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
