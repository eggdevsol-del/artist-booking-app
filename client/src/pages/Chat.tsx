import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar as CalendarIcon, Send, User, Phone, Mail, Cake, CreditCard, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { compressChatImage } from "@/lib/imageCompression";
import ClientProfileModal from "@/components/ClientProfileModal";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id || "0");
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDatesForConfirm, setSelectedDatesForConfirm] = useState<string[]>([]);
  const [currentMessageMetadata, setCurrentMessageMetadata] = useState<any>(null);

  // Get consultation ID from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const consultationId = searchParams.get('consultationId');

  const { data: conversation, isLoading: convLoading } =
    trpc.conversations.getById.useQuery(conversationId, {
      enabled: !!user && conversationId > 0,
    });

  const markAsReadMutation = trpc.conversations.markAsRead.useMutation();

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && user) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, user]);

  const { data: consultation } = trpc.consultations.list.useQuery(undefined, {
    enabled: !!consultationId,
  });

  const consultationData = consultation?.find(c => c.id === parseInt(consultationId || '0'));

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
        messageType: newMessage.messageType,
        metadata: newMessage.metadata || null,
        readBy: null,
        createdAt: new Date(),
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

  const updateMessageMetadataMutation = trpc.messages.updateMetadata.useMutation({
    onSuccess: () => {
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error("Failed to update message: " + error.message);
    },
  });

  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Appointment created");
    },
    onError: (error: any) => {
      toast.error("Failed to create appointment: " + error.message);
    },
  });
  
  const confirmDepositMutation = trpc.appointments.confirmDeposit.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} appointment(s) confirmed!`);
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error("Failed to confirm deposit: " + error.message);
    },
  });

  const uploadImageMutation = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      console.log('[Upload] Image uploaded successfully:', data);
      // Send the image URL as a message
      sendMessageMutation.mutate({
        conversationId,
        content: data.url,
        messageType: "image",
      });
      setUploadingImage(false);
      toast.success("Image uploaded successfully");
    },
    onError: (error: any) => {
      console.error('[Upload] Upload failed:', error);
      toast.error("Failed to upload image: " + error.message);
      setUploadingImage(false);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      conversationId,
      content: messageText,
      messageType: "text",
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[Upload] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    toast.info("Compressing and uploading image...");

    try {
      // Compress image to 1200x1200 max
      const compressedBase64 = await compressChatImage(file);
      console.log('[Upload] Image compressed, base64 length:', compressedBase64.length);
      
      uploadImageMutation.mutate({
        fileName: file.name,
        fileData: compressedBase64,
        contentType: file.type,
      });
    } catch (error) {
      console.error('[Upload] Compression error:', error);
      toast.error("Failed to process image");
      setUploadingImage(false);
    }

    // Reset input
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

  const handleSendBankDetails = () => {
    if (!artistSettings || !conversation) return;

    const bsb = artistSettings.bsb || "[BSB not set]";
    const account = artistSettings.accountNumber || "[Account not set]";
    const depositAmount = artistSettings.depositAmount || "[Amount not set]";
    
    // Get client name from conversation
    const clientName = conversation.clientId; // This should be the client's full name

    const bankDetailsMessage = `Please find deposit details below:

BSB: ${bsb}
ACCOUNT: ${account}
AMOUNT: $${depositAmount}
REFERENCE: ${clientName}

Once transfer is complete, please send a screenshot of remittance here in this message thread.`;

    sendMessageMutation.mutate({
      conversationId,
      content: bankDetailsMessage,
      messageType: "text",
    });
  };

  const handleSendDates = () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }

    // Check if services are available
    if (availableServices.length === 0) {
      toast.error("Please add services in Settings > Work Hours & Services first");
      return;
    }

    // Show service selection dialog
    setShowBookingCalendar(false);
    setShowServiceSelection(true);
  };

  const handleConfirmServiceAndSendDates = () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }

    const datesList = selectedDates
      .sort((a, b) => a.getTime() - b.getTime())
      .map(date => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      .join('\n');

    const message = `I have the following dates available for ${selectedService.name}:\n\n${datesList}\n\nService Details:\n- Duration: ${selectedService.duration} minutes\n- Price: $${selectedService.price}\n${selectedService.description ? `- ${selectedService.description}` : ''}\n\nPlease let me know which date(s) work for you.`;

    // Store service details and deposit info in metadata for later use when client accepts
    const metadata = JSON.stringify({
      serviceName: selectedService.name,
      duration: selectedService.duration,
      price: selectedService.price,
      description: selectedService.description || '',
      depositAmount: artistSettings?.depositAmount || 0,
      bsb: artistSettings?.bsb || '',
      accountNumber: artistSettings?.accountNumber || '',
    });

    sendMessageMutation.mutate({
      conversationId,
      content: message,
      messageType: "appointment_request",
      metadata,
    });

    setSelectedDates([]);
    setShowServiceSelection(false);
    setSelectedService(null);
    toast.success("Dates sent successfully");
  };

  const toggleDateSelection = (date: Date) => {
    const dateStr = date.toDateString();
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr);

    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== dateStr));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
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
      const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => toggleDateSelection(date)}
          className={`h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
            isSelected
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
    <div className="min-h-screen flex flex-col bg-background">
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
          {isArtist && conversation?.otherUser && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowClientInfo(true)}
              title="View client profile"
            >
              <User className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Consultation Info Banner */}
      {consultationData && (
        <div className="bg-primary/10 border-b border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Consultation Request</h3>
              <p className="text-sm text-muted-foreground mt-1">{consultationData.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">{consultationData.description}</p>
              {consultationData.preferredDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Preferred: {consultationData.preferredDate ? new Date(consultationData.preferredDate).toLocaleDateString() : 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              const isAppointmentRequest = message.messageType === "appointment_request" && !isOwn;
              const isAppointmentConfirmed = message.messageType === "appointment_confirmed" && isOwn;
              const isImage = message.messageType === "image";
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 overflow-hidden ${
                      isOwn
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
                    {isAppointmentConfirmed && message.metadata && (() => {
                      try {
                        const metadata = JSON.parse(message.metadata);
                        if (metadata.bsb && metadata.accountNumber) {
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full"
                              onClick={() => {
                                const bankDetails = `BSB: ${metadata.bsb}\nAccount: ${metadata.accountNumber}\nAmount: $${metadata.totalDeposit}`;
                                navigator.clipboard.writeText(bankDetails);
                                toast.success("Bank details copied to clipboard!");
                              }}
                            >
                              Copy Details
                            </Button>
                          );
                        }
                      } catch (e) {
                        console.error('Failed to parse metadata:', e);
                      }
                      return null;
                    })()}
                    {isAppointmentRequest && (() => {
                      // Check if dates have already been accepted
                      let isAccepted = false;
                      if (message.metadata) {
                        try {
                          const metadata = JSON.parse(message.metadata);
                          isAccepted = metadata.accepted === true;
                        } catch (e) {
                          console.error('Failed to parse metadata:', e);
                        }
                      }
                      
                      if (isAccepted) {
                        return (
                          <div className="mt-3 w-full px-3 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium text-center">
                            ✓ Dates Accepted
                          </div>
                        );
                      }
                      
                      return (
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => {
                            // Parse dates from message content
                            const dateRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\w+ \d+, \d{4})/g;
                            const matches = Array.from(message.content.matchAll(dateRegex));
                            const dates = matches.map(match => match[0]);
                            
                            if (dates.length > 0) {
                              // Parse service metadata if available
                              let serviceData: any = {};
                              if (message.metadata) {
                                try {
                                  serviceData = JSON.parse(message.metadata);
                                } catch (e) {
                                  console.error('Failed to parse metadata:', e);
                                }
                              }
                              
                              setAvailableDates(dates);
                              setSelectedDatesForConfirm(dates); // Pre-select all dates
                              setCurrentMessageMetadata({ ...serviceData, messageId: message.id });
                              setShowDateSelection(true);
                            }
                          }}
                        >
                          Accept Dates
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start the conversation!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions + Book Now */}
      {isArtist && quickActions && quickActions.length > 0 && (
        <div className="px-4 py-2 border-t bg-background">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowBookingCalendar(true)}
            >
              <CalendarIcon className="w-4 h-4 mr-1" />
              Book Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleSendBankDetails}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Deposit
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (conversationId) {
                  confirmDepositMutation.mutate({ conversationId });
                }
              }}
            >
              ✓ Confirm
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.slice(0, 6).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-4 py-3 border-t bg-background">
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
            title="Upload image"
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

      {/* Client Profile Modal */}
      {isArtist && conversation?.otherUser && (
        <ClientProfileModal
          clientId={conversation.otherUser.id}
          clientName={conversation.otherUser.name || "Unknown"}
          clientPhone={conversation.otherUser.phone}
          clientEmail={conversation.otherUser.email}
          clientBio={conversation.otherUser.bio}
          isOpen={showClientInfo}
          onClose={() => setShowClientInfo(false)}
          onClientDeleted={() => {
            setLocation("/conversations");
          }}
        />
      )}

      {/* Service Selection Dialog */}
      <Dialog open={showServiceSelection} onOpenChange={setShowServiceSelection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Service</DialogTitle>
            <DialogDescription>
              Choose the service for this booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No services available. Please add services in Settings first.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowServiceSelection(false);
                    setLocation("/work-hours");
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {availableServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedService?.id === service.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-muted-foreground">
                              {service.duration} min
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              ${service.price}
                            </span>
                          </div>
                        </div>
                        {selectedService?.id === service.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowServiceSelection(false);
                      setShowBookingCalendar(true);
                      setSelectedService(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmServiceAndSendDates}
                    disabled={!selectedService}
                  >
                    Confirm & Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Calendar Dialog */}
      <Dialog open={showBookingCalendar} onOpenChange={setShowBookingCalendar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Booking Dates</DialogTitle>
            <DialogDescription>
              Choose one or more dates to propose to the client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                ←
              </Button>
              <h3 className="font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                →
              </Button>
            </div>

            {/* Calendar Grid */}
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Dates Summary */}
            {selectedDates.length > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Dates ({selectedDates.length}):</p>
                <div className="space-y-1">
                  {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedDates([]);
                  setShowBookingCalendar(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendDates}
                disabled={selectedDates.length === 0}
              >
                Send Dates ({selectedDates.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Selection Dialog for Clients */}
      <Dialog open={showDateSelection} onOpenChange={setShowDateSelection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Appointment Dates</DialogTitle>
            <DialogDescription>
              Select the dates you'd like to confirm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Checkboxes */}
            <div className="space-y-2">
              {availableDates.map((date, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5">
                  <input
                    type="checkbox"
                    id={`date-${idx}`}
                    checked={selectedDatesForConfirm.includes(date)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDatesForConfirm([...selectedDatesForConfirm, date]);
                      } else {
                        setSelectedDatesForConfirm(selectedDatesForConfirm.filter(d => d !== date));
                      }
                    }}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <label htmlFor={`date-${idx}`} className="flex-1 text-sm font-medium cursor-pointer">
                    {date}
                  </label>
                </div>
              ))}
            </div>

            {/* Service Info */}
            {currentMessageMetadata && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-semibold">{currentMessageMetadata.serviceName}</p>
                <p className="text-muted-foreground">{currentMessageMetadata.duration} minutes · ${currentMessageMetadata.price}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDateSelection(false);
                  setSelectedDatesForConfirm([]);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (selectedDatesForConfirm.length > 0 && conversation) {
                    const serviceData = currentMessageMetadata || {};
                    
                    // Create appointments for each selected date
                    selectedDatesForConfirm.forEach(dateStr => {
                      const appointmentDate = new Date(dateStr);
                      appointmentDate.setHours(9, 0, 0, 0);
                      const duration = serviceData.duration || 60;
                      const endTime = new Date(appointmentDate.getTime() + duration * 60 * 1000);
                      
                      createAppointmentMutation.mutate({
                        conversationId,
                        artistId: conversation.artistId,
                        clientId: conversation.clientId,
                        title: serviceData.serviceName || "Appointment",
                        description: serviceData.description || "Confirmed booking",
                        startTime: appointmentDate,
                        endTime: endTime,
                        serviceName: serviceData.serviceName,
                        price: serviceData.price,
                      });
                    });
                    
                    // Mark the original message as accepted
                    if (serviceData.messageId) {
                      try {
                        // Update the metadata to include accepted flag
                        const updatedMetadata = {
                          ...serviceData,
                          accepted: true,
                        };
                        delete updatedMetadata.messageId; // Remove messageId from stored metadata
                        
                        await updateMessageMetadataMutation.mutateAsync({
                          messageId: serviceData.messageId,
                          metadata: JSON.stringify(updatedMetadata),
                        });
                      } catch (error) {
                        console.error('Failed to mark message as accepted:', error);
                      }
                    }
                    
                    // Calculate total deposit
                    const depositPerAppointment = serviceData.depositAmount || 0;
                    const totalDeposit = depositPerAppointment * selectedDatesForConfirm.length;
                    
                    // Build confirmation message with payment instructions
                    let confirmationMessage = `I've accepted the following dates:\n${selectedDatesForConfirm.join('\n')}`;
                    
                    // Add payment instructions if deposit is configured
                    if (totalDeposit > 0 && serviceData.bsb && serviceData.accountNumber) {
                      confirmationMessage += `\n\n💰 Deposit Payment Required:\nTotal: $${totalDeposit} (${selectedDatesForConfirm.length} appointments × $${depositPerAppointment})\n\n📋 Bank Details:\nBSB: ${serviceData.bsb}\nAccount: ${serviceData.accountNumber}\nReference: ${user?.name || 'Your Name'}\n\nPlease use your name as the payment reference.`;
                    }
                    
                    // Store bank details in metadata for copy button
                    const metadata = JSON.stringify({
                      bsb: serviceData.bsb,
                      accountNumber: serviceData.accountNumber,
                      totalDeposit,
                    });
                    
                    // Send confirmation message
                    sendMessageMutation.mutate({
                      conversationId,
                      content: confirmationMessage,
                      messageType: "appointment_confirmed",
                      metadata,
                    });
                    
                    toast.success("Dates confirmed!");
                    setShowDateSelection(false);
                    setSelectedDatesForConfirm([]);
                  }
                }}
                disabled={selectedDatesForConfirm.length === 0}
              >
                Accept Dates ({selectedDatesForConfirm.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

