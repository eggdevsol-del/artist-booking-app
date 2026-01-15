import { trpc } from "@/lib/trpc";
import { useMemo, useRef } from "react";
import { useSearchParams } from "wouter";

export function useClientProfileController() {
    // Queries
    const { data: profile, isLoading: loadingProfile } = trpc.clientProfile.getProfile.useQuery();
    const { data: spend, isLoading: loadingSpend } = trpc.clientProfile.getSpendSummary.useQuery();
    const { data: history, isLoading: loadingHistory } = trpc.clientProfile.getHistory.useQuery();
    const { data: boards, isLoading: loadingBoards } = trpc.clientProfile.getBoards.useQuery();
    const { data: photos, isLoading: loadingPhotos } = trpc.clientProfile.getPhotos.useQuery();

    // Trust Badge Logic (Selector)
    const trustBadges = useMemo(() => {
        if (!spend) return [];
        const badges: { id: string; label: string; type: 'gold' | 'platinum' }[] = [];

        // Big Spender: Any single sitting >= $2k
        if (spend.maxSingleSpend >= 2000) {
            badges.push({ id: 'big_spender', label: 'Big Spender', type: 'gold' });
        }

        // Richy Rich: Lifetime >= $30k
        if (spend.totalSpend >= 30000) {
            badges.push({ id: 'richy_rich', label: 'Richy Rich', type: 'platinum' });
        }

        return badges;
    }, [spend]);

    // Smooth Scroll Refs
    const boardsRef = useRef<HTMLDivElement>(null);
    const photosRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (section: 'boards' | 'photos' | 'history' | 'top') => {
        const refs = {
            boards: boardsRef,
            photos: photosRef,
            history: historyRef,
            top: topRef
        };

        refs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return {
        // Data
        profile,
        spend,
        history,
        boards,
        photos,
        trustBadges,

        // Loading States
        isLoading: loadingProfile || loadingSpend || loadingHistory || loadingBoards || loadingPhotos,

        // Refs
        boardsRef,
        photosRef,
        historyRef,
        topRef,

        // Handlers
        scrollToSection
    };
}
