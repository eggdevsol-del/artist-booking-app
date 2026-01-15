import { useClientProfileController } from "@/features/profile/useClientProfileController";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { StatsRow } from "@/features/profile/components/StatsRow";
import { MoodboardList, PhotoGrid, HistoryTimeline } from "@/features/profile/components/ProfileSections";
import { useRegisterBottomNavRow } from "@/contexts/BottomNavContext";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { Button } from "@/components/ui/button";
import { ArrowUp, Edit, Image as ImageIcon, Layout, Plus, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ClientProfile() {
    const {
        profile,
        spend,
        history,
        boards,
        photos,
        trustBadges,
        isLoading,
        scrollToSection,
        // Refs
        topRef,
        boardsRef,
        photosRef,
        historyRef
    } = useClientProfileController();

    const { isContextualVisible } = useBottomNav();
    const isEditMode = isContextualVisible;

    // Define the Contextual Row content
    // We combine Row 1 (Actions) and Row 2 (Jumps) into one scrollable row for v1 compatibility.
    const ProfileActions = (
        <div className="flex items-center gap-2 px-1">
            {/* Row 1: Profile Actions */}
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]">
                <Edit className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-medium">Edit</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]">
                <Plus className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-medium">Board</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]">
                <ImageIcon className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-medium">Photos</span>
            </Button>

            <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />

            {/* Row 2: Jump Actions */}
            <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]"
                onClick={() => scrollToSection('boards')}
            >
                <Layout className="w-6 h-6 mb-0.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Boards</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]"
                onClick={() => scrollToSection('photos')}
            >
                <ImageIcon className="w-6 h-6 mb-0.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Gallery</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]"
                onClick={() => scrollToSection('history')}
            >
                <RotateCcw className="w-6 h-6 mb-0.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">History</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 px-3 gap-1 min-w-[70px]"
                onClick={() => scrollToSection('top')}
            >
                <ArrowUp className="w-6 h-6 mb-0.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Top</span>
            </Button>
        </div>
    );

    useRegisterBottomNavRow("profile-actions", ProfileActions);

    if (isLoading || !profile) {
        return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header Anchor */}
            <div ref={topRef} />

            <ProfileHeader user={profile} badges={trustBadges} />

            <StatsRow
                counts={{
                    boards: boards?.length || 0,
                    photos: photos?.length || 0,
                    history: history?.length || 0
                }}
                onJump={scrollToSection}
            />

            <div className="space-y-2">
                <div ref={boardsRef}>
                    <MoodboardList boards={boards || []} isEditMode={isEditMode} />
                </div>

                <div ref={photosRef}>
                    <PhotoGrid photos={photos || []} isEditMode={isEditMode} />
                </div>

                <div ref={historyRef}>
                    <HistoryTimeline history={history || []} />
                </div>
            </div>
        </div>
    );
}
