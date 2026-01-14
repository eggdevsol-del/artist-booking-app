
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function useChatController(conversationId: number) {
    const { user, loading: authLoading } = useAuth();
    const [, setLocation] = useLocation();
    const [messageText, setMessageText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // UI State
    const [showClientInfo, setShowClientInfo] = useState(false);
    const [showBookingCalendar, setShowBookingCalendar] = useState(false);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Project Wizard State
    const [showProjectWizard, setShowProjectWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState<'service' | 'frequency' | 'review'>('service');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [projectFrequency, setProjectFrequency] = useState<'consecutive' | 'weekly' | 'biweekly' | 'monthly'>('consecutive');
    const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
    const [availableServices, setAvailableServices] = useState<any[]>([]);

    // Client Confirm Dialog State
    const [showClientConfirmDialog, setShowClientConfirmDialog] = useState(false);
    const [clientConfirmMessageId, setClientConfirmMessageId] = useState<number | null>(null);
    const [clientConfirmDates, setClientConfirmDates] = useState<{ date: string, selected: boolean }[]>([]);
    const [clientConfirmMetadata, setClientConfirmMetadata] = useState<any>(null);

    const utils = trpc.useUtils();

    // -- Queries --

    const { data: conversation, isLoading: convLoading } =
        trpc.conversations.getById.useQuery(conversationId, {
            enabled: !!user && conversationId > 0,
        });

    const { data: messages, isLoading: messagesLoading } =
        trpc.messages.list.useQuery(
            { conversationId },
            {
                enabled: !!user && conversationId > 0,
                refetchInterval: 3000,
            }
        );

    const { data: quickActions } = trpc.quickActions.list.useQuery(undefined, {
        enabled: !!user && (user.role === "artist" || user.role === "admin"),
    });

    const { data: artistSettings } = trpc.artistSettings.get.useQuery(undefined, {
        enabled: !!user && (user.role === "artist" || user.role === "admin"),
    });

    // -- Mutations --

    const pinConsultationMutation = trpc.conversations.pinConsultation.useMutation({
        onSuccess: () => {
            utils.conversations.getById.invalidate(conversationId);
            toast.success("Consultation pinned status updated");
        },
        onError: (err) => {
            toast.error("Failed to update pin status");
        }
    });

    const markAsReadMutation = trpc.conversations.markAsRead.useMutation();

    const updateMetadataMutation = trpc.messages.updateMetadata.useMutation({
        onSuccess: () => {
            utils.messages.list.invalidate({ conversationId });
        }
    });

    const sendMessageMutation = trpc.messages.send.useMutation({
        onMutate: async (newMessage) => {
            await utils.messages.list.cancel({ conversationId });
            const previousMessages = utils.messages.list.getData({ conversationId });

            const optimisticMessage = {
                id: Date.now(),
                conversationId: newMessage.conversationId,
                senderId: user?.id || '',
                content: newMessage.content,
                messageType: newMessage.messageType || "text",
                metadata: newMessage.metadata || null,
                readBy: null,
                createdAt: new Date().toISOString(),
                sender: { id: user?.id, name: user?.name, avatar: user?.avatar, role: user?.role } // Mock sender
            };

            utils.messages.list.setData(
                { conversationId },
                (old: any) => old ? [...old, optimisticMessage] : [optimisticMessage]
            );

            return { previousMessages };
        },
        onError: (error: any, newMessage, context) => {
            if (context?.previousMessages) {
                utils.messages.list.setData({ conversationId }, context.previousMessages);
            }
            toast.error("Failed to send message: " + error.message);
        },
        onSuccess: async () => {
            setMessageText("");
            await utils.messages.list.invalidate({ conversationId });
        },
        onSettled: () => {
            // Scroll handled by component via ref usually, but we can expose a trigger
        },
    });

    const bookProjectMutation = trpc.appointments.bookProject.useMutation({
        onSuccess: (data) => {
            toast.success(`${data.count} appointments booked successfully!`);
            utils.messages.list.invalidate({ conversationId });
            setShowClientConfirmDialog(false);
        },
        onError: (err) => {
            toast.error("Failed to book project: " + err.message);
        }
    });

    // -- Effects --

    // Mark as read
    useEffect(() => {
        if (conversationId && user) {
            markAsReadMutation.mutate(conversationId, {
                onSuccess: () => {
                    utils.consultations.list.invalidate();
                }
            });
        }
    }, [conversationId, user]);

    // Parse services
    useEffect(() => {
        if (artistSettings?.services) {
            try {
                const parsed = JSON.parse(artistSettings.services);
                if (Array.isArray(parsed)) {
                    setAvailableServices(parsed);
                }
            } catch (e) {
                console.error("Failed to parse services", e);
            }
        }
    }, [artistSettings]);

    const isArtist = user?.role === "artist" || user?.role === "admin";
    const otherUserId = isArtist ? conversation?.clientId : conversation?.artistId;
    const otherUserName = conversation?.otherUser?.name || "Unknown User";

    return {
        // Data
        user,
        authLoading,
        conversation,
        convLoading,
        messages,
        messagesLoading,
        quickActions,
        artistSettings,
        availableServices,

        // State
        messageText, setMessageText,
        showClientInfo, setShowClientInfo,
        showBookingCalendar, setShowBookingCalendar,
        selectedDates, setSelectedDates,
        currentMonth, setCurrentMonth,
        showProjectWizard, setShowProjectWizard,
        wizardStep, setWizardStep,
        selectedService, setSelectedService,
        projectFrequency, setProjectFrequency,
        projectStartDate, setProjectStartDate,
        showClientConfirmDialog, setShowClientConfirmDialog,
        clientConfirmDates, setClientConfirmDates,
        clientConfirmMetadata, setClientConfirmMetadata,
        clientConfirmMessageId, setClientConfirmMessageId,
        scrollRef, bottomRef,

        // Derived
        isArtist,
        otherUserId,
        otherUserName,

        // Mutations
        sendMessageMutation,
        pinConsultationMutation,
        bookProjectMutation,
        updateMetadataMutation
    };
}
