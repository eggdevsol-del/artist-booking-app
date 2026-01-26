import { format } from "date-fns";
import { Bookmark, Clock, Grid, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui";

// ============================================================================
// Photos Card
// ============================================================================

export function PhotosCard({ photos, isEditMode }: { photos: any[], isEditMode: boolean }) {
    return (
        <div className="h-full">
            {photos?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground opacity-50">
                    <Grid className="w-10 h-10 mb-4" />
                    <p>No photos yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1">
                    {/* Add Photo Button in Grid (Edit Mode Only?) */}
                    {isEditMode && (
                        <div className="aspect-square bg-muted/20 flex flex-col items-center justify-center text-muted-foreground">
                            <span className="text-xs">Add</span>
                        </div>
                    )}

                    {photos?.map(photo => (
                        <div key={photo.id} className="aspect-square relative overflow-hidden bg-muted rounded-md group">
                            <img src={photo.url} alt="User upload" className="w-full h-full object-cover" loading="lazy" />
                            {isEditMode && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    {/* Delete action */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// History Card
// ============================================================================

export function HistoryCard({ history }: { history: any[] }) {
    return (
        <div className="h-full">
            {history?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground opacity-50">
                    <Clock className="w-10 h-10 mb-4" />
                    <p>No history yet</p>
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
    );
}

// ============================================================================
// Saved Card
// ============================================================================

export function SavedCard() {
    return (
        <div className="h-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground opacity-50">
            <Bookmark className="w-12 h-12 mb-4" />
            <p className="text-sm max-w-[200px]">Save posts and flashes to view them here.</p>
        </div>
    );
}
