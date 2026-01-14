import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";

/**
 * Selector to get the total unread message count across all conversations
 */
export const useTotalUnreadCount = () => {
    const { user } = useAuth();

    // We heavily rely on the cached query here. 
    // Ideally this query is cheap or we have a dedicated lightweight query for counts.
    // For now, we use the existing list query.
    const { data: conversations } = trpc.conversations.list.useQuery(undefined, {
        enabled: !!user,
        // Using a longer staleTime for the count might be appropriate if we want to avoid 
        // frequent refetches just for a badge, but for messaging, freshness is usually desired.
        refetchInterval: 30000,
    });

    return useMemo(() => {
        if (!conversations) return 0;
        return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    }, [conversations]);
};

/**
 * Selector to get a specific conversation by ID from the cache
 */
export const useConversation = (conversationId: number) => {
    const { user } = useAuth();
    const { data: conversations } = trpc.conversations.list.useQuery(undefined, {
        enabled: !!user,
    });

    return useMemo(() => {
        return conversations?.find(c => c.id === Number(conversationId));
    }, [conversations, conversationId]);
};
