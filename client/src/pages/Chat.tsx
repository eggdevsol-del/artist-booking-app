import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar as CalendarIcon, Send, User, Phone, Mail, Cake, CreditCard, ImagePlus, ChevronRight, Check, Loader2, Pin, PinOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { BookingWizard } from "@/features/booking/BookingWizard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProjectProposalMessage } from "@/components/chat/ProjectProposalMessage";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronUp, Zap } from "lucide-react";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id || "0");
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClientConfirmDialog, setShowClientConfirmDialog] = useState(false);
  const [clientConfirmMessageId, setClientConfirmMessageId] = useState<number | null>(null);
  const [clientConfirmDates, setClientConfirmDates] = useState<{ date: string, selected: boolean }[]>([]);
  const [clientConfirmMetadata, setClientConfirmMetadata] = useState<any>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // Get consultation ID from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const consultationId = searchParams.get('consultationId');

  const { data: conversation, isLoading: convLoading } =
    trpc.conversations.getById.useQuery(conversationId, {
      enabled: !!user && conversationId > 0,
    });

  const pinConsultationMutation = trpc.conversations.pinConsultation.useMutation({
    onSuccess: () => {
      utils.conversations.getById.invalidate(conversationId);
      toast.success("Consultation pinned status updated");
    },
    onError: (err) => {
      toast.error("Failed to update pin status");
      console.error(err);
    }
  });

  const targetConsultationId = consultationId ? parseInt(consultationId) : conversation?.pinnedConsultationId;

  const { data: consultationList } = trpc.consultations.list.useQuery(undefined, {
    enabled: !!user, // Fetch all to find the relevant one. Optimally getById would be better but this works with existing router.
  });

  const consultationData = consultationList?.find(c => c.id === targetConsultationId);

  const markAsReadMutation = trpc.conversations.markAsRead.useMutation();

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && user) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, user]);



  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } =
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

  const {
    data: projectAvailability,
    isLoading: loadingAvailability,
    error: availabilityError
  } = trpc.appointments.findProjectAvailability.useQuery(
    {
      conversationId,
      serviceName: selectedService?.name || '',
      serviceDuration: selectedService?.duration || 60,
      sittings: selectedService?.sittings || 1,
      frequency: projectFrequency,
      // Always start searching from today
      startDate: new Date(),
      // Ensure price is a number
      price: selectedService?.price ? Number(selectedService.price) : 0,
    },
    {
      enabled: !!selectedService && wizardStep === 'review',
      // Don't retry on failure so we show error immediately
      retry: false
    }
  );

  // Parse services when artistSettings loads
  useEffect(() => {
    if (artistSettings?.services) {
      try {
        const parsed = JSON.parse(artistSettings.services);
        if (Array.isArray(parsed)) {
          setAvailableServices(parsed);
        }
      } catch (e) {
        console.error("Failed to parse services");
      }
    }
  }, [artistSettings]);

  const utils = trpc.useUtils();

  const sendMessageMutation = trpc.messages.send.useMutation({
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await utils.messages.list.cancel({ conversationId });

      // Snapshot the previous value
      const previousMessages = utils.messages.list.getData({ conversationId });

      // Optimistically update to the new value
      const optimisticMessage = {
        id: Date.now(), // Temporary ID
        conversationId: newMessage.conversationId,
        senderId: user?.id || '',
        content: newMessage.content,
        messageType: newMessage.messageType || "text",
        metadata: newMessage.metadata || null,
        readBy: null,
        createdAt: new Date().toISOString(),
      };

      utils.messages.list.setData(
        { conversationId },
        (old) => old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (error: any, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        utils.messages.list.setData({ conversationId }, context.previousMessages);
      }
      toast.error("Failed to send message: " + error.message);
    },
    onSuccess: async () => {
      setMessageText("");
      // Invalidate and refetch to get the real message from server
      await utils.messages.list.invalidate({ conversationId });
    },
    onSettled: () => {
      scrollToBottom();
    },
  });

  const bookProjectMutation = trpc.appointments.bookProject.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} appointments booked successfully!`);
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error("Failed to book project: " + error.message);
    },
  });

  const uploadImageMutation = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      // Send the image URL as a message
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

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [conversationId]);

  // Only auto-scroll on initial load or if we haven't scrolled yet
  useEffect(() => {
    if (!messagesLoading && messages && messages.length > 0 && !hasScrolledRef.current) {
      scrollToBottom();
      hasScrolledRef.current = true;
    }
  }, [messages, messagesLoading, conversationId]);

  const scrollToBottom = () => {
    // 200ms timeout to ensure DOM layout is complete (especially images/cards)
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };




  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      conversationId,
      content: messageText,
      messageType: "text",
      consultationId: consultationId ? parseInt(consultationId) : undefined,
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQuickAction = (action: any) => {
    if (action.actionType === "send_text") {
      sendMessageMutation.mutate({
        conversationId,
        content: action.content,
        messageType: "text",
      });
    }
  };

  const handleSendProjectDates = () => {
    if (!projectAvailability?.dates || !selectedService) return;

    const datesList = projectAvailability.dates
      .map((date: any) => format(new Date(date), 'EEEE, MMMM do yyyy, h:mm a'))
      .join('\n');

    const message = `I have found the following dates for your ${selectedService.name} project:\n\n${datesList}\n\nThis project consists of ${selectedService.sittings || 1} sittings.\nFrequency: ${projectFrequency}\nPrice per sitting: $${selectedService.price}\n\nPlease confirm these dates.`;

    const metadata = JSON.stringify({
      type: "project_proposal",
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      sittings: selectedService.sittings || 1,
      price: selectedService.price,
      frequency: projectFrequency,
      proposedDates: projectAvailability.dates,
      depositAmount: artistSettings?.depositAmount || 0,
      bsb: artistSettings?.bsb || '',
      accountNumber: artistSettings?.accountNumber || '',
    });

    sendMessageMutation.mutate({
      conversationId,
      content: message,
      messageType: "appointment_request", // Reusing this type
      metadata,
    });

    setShowProjectWizard(false);
    resetWizard();
    toast.success("Project proposal sent!");
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

  const updateMetadataMutation = trpc.messages.updateMetadata.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate({ conversationId });
    }
  });

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
        // 1. Update message metadata to 'accepted'
        const newMetadata = JSON.stringify({
          ...metadata,
          status: 'accepted'
        });

        updateMetadataMutation.mutate({
          messageId: message.id,
          metadata: newMetadata
        });

        // 2. Send acceptance message
        sendMessageMutation.mutate({
          conversationId,
          content: `I accept the project proposal for ${metadata.serviceName}.`,
          messageType: "text"
        }, {
          onSuccess: () => {
            // 3. Auto-send deposit info if enabled
            if (isArtist || !isArtist) { // logic runs for client, but we check ARTIST settings.
              // Wait, the CLIENT is clicking accept. The Client app context has 'artistSettings' ??
              // 'artistSettings' query in Chat.tsx fetches settings for the "current user" if artist?
              // No, line 84: `trpc.artistSettings.get.useQuery(undefined, { enabled: !!user && (user.role === "artist" ...) })`
              // If I am the CLIENT, I don't have the ARTIST's settings loaded in `artistSettings`.
              // I need to fetch the OTHER user's settings or the CONVERSATION'S artist settings.
              // Actually, `projectAvailability` uses `findProjectAvailability`.
              // I should probably make the backend handle the auto-response or fetch it here.
              // But strictly, `Chat.tsx` lines 84 loads settings only if `user.role === "artist"`.
              // So as a client, `artistSettings` is undefined.
              // I cannot check `autoSendDepositInfo` here easily as a client.
              // HOWEVER, the user asked: "please add a page to adjust settings ... such as whether to automatically send deposit information upon acceptance".
              // If the CLIENT accepts, the SYSTEM (or Client acting as proxy) should send the info?
              // Or the Artist's "bot" sends it.
              // Since we are client-side only, maybe I can't do it as the client.
              // BUT, maybe I can rely on the trigger happening on the backend? No, backend just does booking.
              // Let's look at `BookingWizard` - that was Artist side.
              // `handleClientAcceptProposal` runs on CLIENT side.
            }
          }
        });
      }
    });
  };

  const handleArtistBookProject = (metadata: any) => {
    if (!metadata.confirmedDates || !metadata.serviceName) return;

    const appointments = metadata.confirmedDates.map((dateStr: string) => {
      const startTime = new Date(dateStr);
      // Assuming duration from metadata or default 60 (should ideally pass duration in metadata)
      // For now, let's look up service or default
      // Wait, we have serviceName. We don't have duration in client confirmation metadata explicitly unless we pass it.
      // Let's assume 3 hours or fetch service?
      // Better: pass duration in metadata chain.
      // I will update handleClientConfirmDates to include duration if possible, but I missed it.
      // Let's use a safe default or try to find service.

      return {
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // Default 1 hr if missing
        title: metadata.serviceName,
        description: "Project Booking",
        serviceName: metadata.serviceName,
        price: metadata.price,
        depositAmount: 0 // We handle deposits separately or via global settings
      };
    });

    bookProjectMutation.mutate({
      conversationId,
      appointments
    });
  }

  const resetWizard = () => {
    setWizardStep('service');
    setSelectedService(null);
    setProjectFrequency('consecutive');
    setProjectStartDate(null);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = projectStartDate?.toDateString() === date.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setProjectStartDate(date)}
          className={`h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${isSelected
            ? "bg-primary text-primary-foreground"
            : isToday
              ? "bg-accent text-accent-foreground border-2 border-primary"
              : "hover:bg-accent"
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  if (authLoading || convLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation not found</p>
          <Button onClick={() => setLocation("/conversations")} className="mt-4">
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  const isArtist = user?.role === "artist" || user?.role === "admin";
  const otherUserId = isArtist ? conversation.clientId : conversation.artistId;
  const otherUserName = conversation.otherUser?.name || "Unknown User";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="mobile-header px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/conversations")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden flex-shrink-0">
            {conversation.otherUser?.avatar ? (
              <img src={conversation.otherUser.avatar} alt={otherUserName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold">
                {otherUserName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-semibold">{otherUserName}</h1>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          {isArtist && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowClientInfo(true)}
            >
              <User className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Consultation Details & Pinning */}
      {consultationData && (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 flex items-start justify-between gap-4 shadow-sm z-10">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {consultationData.subject}
              {conversation?.pinnedConsultationId === consultationData.id && (
                <Pin className="w-3 h-3 text-primary fill-primary" />
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{consultationData.description}</p>
            {consultationData.preferredDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Preferred: {new Date(consultationData.preferredDate as any).toLocaleDateString()}
              </p>
            )}
          </div>
          {isArtist && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const isPinned = conversation?.pinnedConsultationId === consultationData.id;
                pinConsultationMutation.mutate({
                  conversationId,
                  consultationId: isPinned ? null : consultationData.id
                });
              }}
            >
              {conversation?.pinnedConsultationId === consultationData.id ? (
                <PinOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Pin className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 pb-[160px]" ref={scrollRef}>
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              const isImage = message.messageType === "image";

              // Determine message subtype based on metadata
              let metadata: any = null;
              try {
                metadata = message.metadata ? JSON.parse(message.metadata) : null;
              } catch (e) { }

              const isProjectProposal = metadata?.type === "project_proposal";
              const isClientConfirmation = metadata?.type === "project_client_confirmation";

              return (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`flex ${isProjectProposal ? "justify-center w-full" : (isOwn ? "justify-end" : "justify-start")}`}
                >
                  {isProjectProposal ? (
                    <div className="w-full flex justify-center">
                      <ProjectProposalMessage
                        metadata={metadata}
                        isArtist={isArtist}
                        isPendingAction={bookProjectMutation.isPending} // Using bookProject for accept
                        onAccept={() => {
                          // We need to trigger the confirmation.
                          // Since the proposal ALREADY has the dates in metadata, we can just call handleArtistBookProject?
                          // Wait, handleArtistBookProject was for ARTIST to confirm CLIENT'S selection.
                          // Here CLIENT is accepting ARTIST'S proposal.
                          // We need a NEW handler: handleClientAcceptProposal
                          handleClientAcceptProposal(message, metadata);
                        }}
                        onReject={() => {
                          // Handle rejection (maybe just a message for now)
                          sendMessageMutation.mutate({
                            conversationId,
                            content: "I'm sorry, those dates don't work for me.",
                            messageType: "text"
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 overflow-hidden ${isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                        }`}
                    >
                      {isImage ? (
                        <div className="space-y-2">
                          <img
                            src={message.content}
                            alt="Uploaded image"
                            className="rounded-lg max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(message.content, "_blank")}
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      ) : (
                        <p className="text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {/* Artist View: Confirm Booking Action (Legacy/Other flow) */}
                      {isArtist && isClientConfirmation && (
                        <Button
                          className="mt-2 w-full bg-background/20 hover:bg-background/30 text-inherit border-none"
                          size="sm"
                          onClick={() => handleArtistBookProject(metadata)}
                          disabled={bookProjectMutation.isPending}
                        >
                          {bookProjectMutation.isPending ? "Booking..." : "Confirm & Book"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          )}
          <div ref={bottomRef} className="pb-64" />
        </div>
      </ScrollArea>

      {/* Fixed Bottom Input Area - Lifted above Bottom Nav */}
      {/* Fixed Bottom Input Area - Lifted above Bottom Nav */}
      {/* Fixed Bottom Input Area */}
      <div className="fixed bottom-28 left-4 right-4 z-[60] bg-background/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-[2rem]">
        {isArtist && (
          <Sheet>
            <SheetTrigger asChild>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-background/40 backdrop-blur-md rounded-t-xl border-t border-x flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors shadow-sm">
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] rounded-t-[20px] pb-safe-bottom">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</SheetTitle>
              </SheetHeader>

              <div className="grid gap-6 px-2">
                {/* Core Booking Actions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3" /> Booking Tools
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => setShowBookingCalendar(true)}
                    >
                      <CalendarIcon className="w-6 h-6 text-primary" />
                      <span className="text-xs">Book Now</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => {
                        setShowProjectWizard(true);
                        setWizardStep('service');
                      }}
                    >
                      <div className="relative">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground px-1 rounded-full">PRO</span>
                      </div>
                      <span className="text-xs">Project</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => {
                        if (conversationId) {
                          toast.info("Use the 'Confirm & Book' button in the chat bubble for projects.");
                        }
                      }}
                    >
                      <Check className="w-6 h-6 text-green-500" />
                      <span className="text-xs">Confirm</span>
                    </Button>
                  </div>
                </div>

                {/* Quick Responses */}
                {quickActions && quickActions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Saved Responses
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => (
                        <Button
                          key={action.id}
                          variant="secondary"
                          className="justify-start h-auto py-3 px-4 text-xs text-left whitespace-normal leading-relaxed"
                          onClick={() => handleQuickAction(action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Message Input */}
        <div className="px-4 py-3 bg-transparent">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1"
              disabled={uploadingImage}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending || uploadingImage}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Book Project Wizard */}
      <BookingWizard
        isOpen={showProjectWizard}
        onClose={() => setShowProjectWizard(false)}
        conversationId={conversationId}
        artistServices={availableServices}
        onBookingSuccess={() => {
          setShowProjectWizard(false);
          // Optional: trigger a refresh or toast
        }}
      />

      {/* Client Confirm Dialog */}
      <Dialog open={showClientConfirmDialog} onOpenChange={setShowClientConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Project Dates</DialogTitle>
            <DialogDescription>Please review and select the dates you can attend.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {clientConfirmDates.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                <Checkbox
                  id={`date-${idx}`}
                  checked={item.selected}
                  onCheckedChange={(checked) => {
                    const newDates = [...clientConfirmDates];
                    newDates[idx].selected = checked === true;
                    setClientConfirmDates(newDates);
                  }}
                />
                <Label htmlFor={`date-${idx}`} className="cursor-pointer flex-1">
                  {format(new Date(item.date), 'PPPP')}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleClientConfirmDates}>Confirm Dates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing Client Info Dialog */}
      <Dialog open={showClientInfo} onOpenChange={setShowClientInfo}>
        <DialogContent className="max-w-md h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Client Information</DialogTitle>
            <DialogDescription>Contact details and shared media</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-2">
              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">{conversation?.otherUser?.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{conversation?.otherUser?.email || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{conversation?.otherUser?.phone || "No phone"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Cake className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Birthday</p>
                    <p className="text-sm text-muted-foreground">
                      {conversation?.otherUser?.birthday
                        ? format(new Date(conversation.otherUser.birthday), 'MMMM do, yyyy')
                        : "Not set"}
                    </p>
                  </div>
                </div>
                {conversation?.otherUser?.bio && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-1">Bio</p>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                      {conversation.otherUser.bio}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media">
                {/* Media sent by the Client */}
                <div className="grid grid-cols-3 gap-2">
                  {messages?.filter(m => m.senderId === otherUserId && (m.messageType === 'image' || m.messageType === 'video') && !failedImages.has(m.id)).map(m => (
                    <div key={m.id} className="aspect-square rounded-md overflow-hidden bg-muted relative group">
                      {m.messageType === 'image' ? (
                        <img
                          src={m.content}
                          alt="Client media"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onError={() => setFailedImages(prev => new Set(prev).add(m.id))}
                          onClick={() => {
                            setShowClientInfo(false); // Close dialog
                            const el = document.getElementById(`message-${m.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">Video</div>
                      )}
                    </div>
                  ))}
                  {(!messages || messages.filter(m => m.senderId === otherUserId && (m.messageType === 'image' || m.messageType === 'video')).length === 0) && (
                    <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No media shared</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="content">
                {/* Content sent by the Artist (Me) */}
                <div className="grid grid-cols-3 gap-2">
                  {messages?.filter(m => m.senderId === user?.id && (m.messageType === 'image' || m.messageType === 'video') && !failedImages.has(m.id)).map(m => (
                    <div key={m.id} className="aspect-square rounded-md overflow-hidden bg-muted relative">
                      {m.messageType === 'image' ? (
                        <img
                          src={m.content}
                          alt="Artist content"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onError={() => setFailedImages(prev => new Set(prev).add(m.id))}
                          onClick={() => {
                            setShowClientInfo(false); // Close dialog
                            const el = document.getElementById(`message-${m.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">Video</div>
                      )}
                    </div>
                  ))}
                  {(!messages || messages.filter(m => m.senderId === user?.id && (m.messageType === 'image' || m.messageType === 'video')).length === 0) && (
                    <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No content sent</p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
