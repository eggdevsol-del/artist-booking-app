import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

// ============================================================================
// Moodboard Section
// ============================================================================

export function MoodboardList({ boards, isEditMode }: { boards: any[], isEditMode: boolean }) {
    return (
        <div className="space-y-4 px-4 pb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Moodboards</h2>
                {isEditMode && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full text-xs">
                        <Plus className="w-3 h-3" /> Add Board
                    </Button>
                )}
            </div>

            {boards?.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-white/5">
                    <p className="text-muted-foreground text-sm">No boards yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {boards?.map(board => (
                        <div key={board.id} className="group relative overflow-hidden rounded-2xl aspect-[3/1] bg-muted/30 border border-white/5">
                            {/* Simple Placeholder for the v1 board card */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                                <h3 className="text-lg font-medium text-white/80">{board.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Photo Grid Section
// ============================================================================

export function PhotoGrid({ photos, isEditMode }: { photos: any[], isEditMode: boolean }) {
    return (
        <div className="space-y-4 px-4 pb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Reference Photos</h2>
                {isEditMode && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full text-xs">
                        <Plus className="w-3 h-3" /> Add Photos
                    </Button>
                )}
            </div>

            {photos?.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-white/5">
                    <p className="text-muted-foreground text-sm">No photos uploaded.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1">
                    {photos?.map(photo => (
                        <div key={photo.id} className="aspect-square relative overflow-hidden bg-muted rounded-md">
                            <img src={photo.url} alt="User upload" className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// History Section
// ============================================================================

export function HistoryTimeline({ history }: { history: any[] }) {
    return (
        <div className="space-y-4 px-4 pb-12">
            <h2 className="text-lg font-semibold tracking-tight">History</h2>

            {history?.length === 0 ? (
                <div className="p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground text-sm">No booking history yet.</p>
                </div>
            ) : (
                <div className="space-y-0 relative border-l border-white/10 ml-3 pl-6 py-2">
                    {history?.map((item) => (
                        <div key={item.id} className="relative mb-8 last:mb-0">
                            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                                    {format(new Date(item.date), 'MMM d, yyyy')}
                                </span>
                                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                                <p className="text-xs text-muted-foreground/80 mt-0.5">{item.description}</p>
                                <span className="inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground w-fit capitalize">
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
