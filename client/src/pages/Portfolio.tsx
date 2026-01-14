import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useRegisterBottomNavRow } from "@/contexts/BottomNavContext";
import { BottomNavRow } from "@/components/BottomNavRow";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Portfolio() {
    const { user } = useAuth();
    const isArtist = user?.role === 'artist' || user?.role === 'admin';

    const portfolioActionsRow = useMemo(() => (
        <BottomNavRow>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative text-muted-foreground opacity-70 hover:opacity-100">
                <div className="relative"><Upload className="w-6 h-6 mb-0.5" /></div>
                <span className="text-[10px] font-medium font-normal">Upload</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 px-3 gap-1 hover:bg-transparent min-w-[70px] snap-center shrink-0 transition-all duration-300 relative text-muted-foreground opacity-70 hover:opacity-100">
                <div className="relative"><Trash2 className="w-6 h-6 mb-0.5" /></div>
                <span className="text-[10px] font-medium font-normal">Manage</span>
            </Button>
        </BottomNavRow>
    ), []);

    useRegisterBottomNavRow("portfolio-actions", portfolioActionsRow);

    const { data: portfolioItems, isLoading } = trpc.portfolio.list.useQuery(
        isArtist ? { artistId: user?.id } : undefined
    );

    // Placeholder for mutation
    const toggleLikeMutation = trpc.portfolio.toggleLike.useMutation();

    if (isLoading) {
        return <div className="p-10 text-center animate-pulse">Loading gallery...</div>;
    }

    return (
        <div className="min-h-screen py-6 px-4 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                    {isArtist ? "My Portfolio" : "Explore"}
                </h1>
                {isArtist && (
                    <Button size="sm" variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {portfolioItems?.map((item) => (
                    <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-muted">
                        <img
                            src={item.imageUrl}
                            alt={item.description || "Portfolio item"}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            {isArtist ? (
                                <Button size="icon" variant="destructive" className="rounded-full h-9 w-9">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`rounded-full h-9 w-9 bg-white/10 hover:bg-white/20 ${item.isLiked ? 'text-red-500' : 'text-white'}`}
                                >
                                    <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-current' : ''}`} />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {portfolioItems?.length === 0 && (
                    <div className="col-span-2 py-10 text-center text-muted-foreground">
                        {isArtist ? "No images yet. Upload some work!" : "No portfolio items found."}
                    </div>
                )}
            </div>
        </div>
    );
}
