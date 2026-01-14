
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

export function useChatController(conversationId: number) {
    const { user, loading: authLoading } = useAuth();
    const [messageText, setMessageText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // URL Params (Consultation ID)
    const searchParams = new URLSearchParams(window.location.search);
    const paramConsultationId = searchParams.get('consultationId');

    // UI State
    const [uploadingImage, setUploadingImage] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
    const hasScrolledRef = useRef(false);
    const [showClientInfo, setShowClientInfo] = useState(false);
    const [showBookingCalendar, setShowBookingCalendar] = useState(false);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Project Wizard State
    const [showProjectWizard, setShowProjectWizard] = useState(false);
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

    const { data: consultationList } = trpc.consultations.list.useQuery(undefined, {
        enabled: !!user,
    });

    const targetConsultationId = paramConsultationId ? parseInt(paramConsultationId) : conversation?.pinnedConsultationId;
    const consultationData = consultationList?.find(c => c.id === targetConsultationId);

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

    const uploadImageMutation = trpc.upload.uploadImage.useMutation({
        onSuccess: (data) => {
            sendMessageMutation.mutate({
                conversationId,
                content: data.url,
                messageType: "image",
            });
            setUploadingImage(false);
        },
        onError: (error: any) => {
            toast.error("Failed to upload image: " + error.message);
            setUploadingImage(false);
        },
    });

    // -- Handlers --

    const handleSendMessage = () => {
        if (!messageText.trim()) return;
        sendMessageMutation.mutate({
            conversationId,
            content: messageText,
            messageType: "text",
            consultationId: paramConsultationId ? parseInt(paramConsultationId) : undefined,
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image size must be less than 10MB");
            return;
        }
        setUploadingImage(true);
        toast.info("Uploading image...");
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            uploadImageMutation.mutate({
                fileName: file.name,
                fileData: base64Data,
                contentType: file.type,
            });
        };
        reader.onerror = () => {
            toast.error("Failed to read image file");
            setUploadingImage(false);
        };
        reader.readAsDataURL(file);
        // Note: Caller is responsible for clearing input value if needed, or we rely on React key reset
    };

    const handleQuickAction = (action: any) => {
        if (action.actionType === "find_availability") {
            setShowProjectWizard(true);
            return;
        }

        // For send_text, custom, and deposit_info, we just send the content as a message
        if (["send_text", "custom", "deposit_info"].includes(action.actionType)) {
            sendMessageMutation.mutate({
                conversationId,
                content: action.content,
                messageType: "text",
            });
        }
    };

    const handleClientConfirmDates = async () => {
        if (!clientConfirmMessageId || !clientConfirmMetadata) return;

        const selectedDateStrings = clientConfirmDates
            .filter(d => d.selected)
            .map(d => d.date);

        if (selectedDateStrings.length === 0) {
            toast.error("Please select at least one date");
            return;
        }

        const message = `I confirm the following dates:\n\n${selectedDateStrings.map(d => format(new Date(d), 'PPP p')).join('\n')}`;

        const metadata = JSON.stringify({
            type: "project_client_confirmation",
            confirmedDates: selectedDateStrings,
            originalMessageId: clientConfirmMessageId,
            serviceName: clientConfirmMetadata.serviceName,
            price: clientConfirmMetadata.price
        });

        sendMessageMutation.mutate({
            conversationId,
            content: message,
            messageType: "text",
            metadata
        });

        setShowClientConfirmDialog(false);
        toast.success("Dates confirmed!");
    };

    const handleClientAcceptProposal = (message: any, metadata: any) => {
        if (!metadata.proposedDates && !metadata.dates) return;
        const bookingDates = metadata.dates || metadata.proposedDates || [];

        if (!Array.isArray(bookingDates) || bookingDates.length === 0) {
            toast.error("No dates found in proposal");
            return;
        }

        const appointments = bookingDates.map((dateStr: string) => {
            const startTime = new Date(dateStr);
            const duration = metadata.serviceDuration || 60;

            return {
                startTime,
                endTime: new Date(startTime.getTime() + duration * 60 * 1000),
                title: metadata.serviceName,
                description: "Project Booking (Client Accepted)",
                serviceName: metadata.serviceName,
                price: metadata.price || 0,
                depositAmount: 0
            };
        });

        bookProjectMutation.mutate({
            conversationId,
            appointments
        }, {
            onSuccess: () => {
                const newMetadata = JSON.stringify({
                    ...metadata,
                    status: 'accepted'
                });

                updateMetadataMutation.mutate({
                    messageId: message.id,
                    metadata: newMetadata
                });

                sendMessageMutation.mutate({
                    conversationId,
                    content: `I accept the project proposal for ${metadata.serviceName}.`,
                    messageType: "text"
                });
            }
        });
    };

    const handleArtistBookProject = (metadata: any) => {
        if (!metadata.confirmedDates || !metadata.serviceName) return;

        const appointments = metadata.confirmedDates.map((dateStr: string) => {
            const startTime = new Date(dateStr);
            return {
                startTime,
                endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // Default 1 hr if missing
                title: metadata.serviceName,
                description: "Project Booking",
                serviceName: metadata.serviceName,
                price: metadata.price,
                depositAmount: 0
            };
        });

        bookProjectMutation.mutate({
            conversationId,
            appointments
        });
    };

    // Calendar Logic
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ type: 'empty', key: `empty-${i}` });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({ type: 'day', day, date, key: day });
        }
        return days;
    }, [currentMonth]);

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
        projectStartDate, setProjectStartDate,
        showClientConfirmDialog, setShowClientConfirmDialog,
        clientConfirmDates, setClientConfirmDates,
        clientConfirmMetadata, setClientConfirmMetadata,
        clientConfirmMessageId, setClientConfirmMessageId,
        scrollRef, bottomRef,
        uploadingImage,
        hasScrolledRef,

        // Derived
        isArtist,
        otherUserId,
        otherUserName,
        consultationData,
        calendarDays,

        // Handlers
        handleSendMessage,
        handleImageUpload,
        handleQuickAction,
        handleClientConfirmDates,
        handleClientAcceptProposal,
        handleArtistBookProject,
        nextMonth, prevMonth,

        // Mutations
        sendMessageMutation,
        pinConsultationMutation,
        bookProjectMutation,
        updateMetadataMutation,
        uploadImageMutation
    };
}
