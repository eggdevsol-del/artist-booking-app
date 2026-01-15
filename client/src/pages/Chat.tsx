import { ModalShell } from "@/components/ui/overlays/modal-shell";
// import { SheetShell } from "@/components/ui/overlays/sheet-shell"; // REMOVED
import { useChatController } from "@/features/chat/useChatController";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingWizard } from "@/features/booking/BookingWizard";
import { ClientProfileSheet } from "@/features/chat/ClientProfileSheet";
import { ProjectProposalMessage } from "@/components/chat/ProjectProposalMessage";
import { ProjectProposalModal } from "@/features/chat/components/ProjectProposalModal";
import { ArrowLeft, Send, User, Phone, Mail, Cake, ImagePlus, Pin, PinOff, Calendar, FileText, Zap } from "lucide-react";
import { useRegisterBottomNavRow } from "@/contexts/BottomNavContext";
import { QuickActionsRow, ChatAction } from "@/features/chat/components/QuickActionsRow";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id || "0");
  const [, setLocation] = useLocation();

  const {
    user,
    authLoading,
    conversation,
    convLoading,
    messages,
    messagesLoading,
    quickActions,
    availableServices,

    // State
    messageText, setMessageText,
    showClientInfo, setShowClientInfo,
    showBookingCalendar, setShowBookingCalendar,
    showProjectWizard, setShowProjectWizard,
    projectStartDate, setProjectStartDate,

    // Derived
    isArtist,
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
    nextMonth,
    prevMonth,

    // Mutations used for loading states
    sendMessageMutation,
    pinConsultationMutation,
    bookProjectMutation,
    uploadingImage,

    // Refs
    viewportRef,
    handleScroll,
    // (Removed scrollRef, bottomRef, hasScrolledRef)

    // Client Confirm State
    showClientConfirmDialog, setShowClientConfirmDialog,
    clientConfirmDates, setClientConfirmDates,

    // Proposal Modal
    selectedProposal, setSelectedProposal,
    handleViewProposal,

  } = useChatController(conversationId);

  // Register Bottom Nav Contextual Row (Quick Actions + System Actions)
  const quickActionsRow = useMemo(() => {
    const isAuthorized = user?.role === 'artist' || user?.role === 'admin';

    // System Actions (Fixed) - Only for Artists
    const systemActions: ChatAction[] = isAuthorized ? [
      {
        id: 'chat.book',
        label: 'Book',
        icon: Calendar,
        onClick: () => setShowBookingCalendar(true),
        highlight: true
      },
      {
        id: 'chat.proposal',
        label: 'Proposal',
        icon: FileText,
        onClick: () => setShowProjectWizard(true),
        highlight: true
      }
    ] : [];

    // User Configured Actions
    const userActions: ChatAction[] = isAuthorized && quickActions ? quickActions.map(qa => {
      // Icon Mapping
      let Icon = Zap;
      if (qa.actionType === 'find_availability') Icon = FileText;
      else if (qa.actionType === 'deposit_info') Icon = Send;

      return {
        id: qa.id,
        label: qa.label,
        icon: Icon,
        onClick: () => handleQuickAction(qa),
        highlight: false
      };
    }) : [];

    // Validated Composition
    const allActions = [...systemActions, ...userActions];

    if (allActions.length === 0) {
      return null;
    }

    return (
      <QuickActionsRow actions={allActions} />
    );
  }, [quickActions, user?.role, handleQuickAction, setShowBookingCalendar, setShowProjectWizard]);

  useRegisterBottomNavRow("chat", quickActionsRow);

  // Local UI Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Key press handler local (calls hook handler)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden selection:bg-primary/20">

      {/* Fixed Header & Consultation Pin */}
      <div className="flex-none z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm supports-[backdrop-filter]:bg-background/60">
        <header className="mobile-header px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 -ml-2"
              onClick={() => setLocation("/conversations")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-background shadow-md">
              {conversation.otherUser?.avatar ? (
                <img src={conversation.otherUser.avatar} alt={otherUserName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold">
                  {otherUserName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-base leading-tight">{otherUserName}</h1>
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
            {isArtist && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 -mr-2"
                onClick={() => setShowClientInfo(true)}
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Consultation Details & Pinning */}
        {consultationData && (
          <div className="px-4 py-3 border-t border-white/5 bg-accent/5 backdrop-blur-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground/90">
                {consultationData.subject}
                {conversation?.pinnedConsultationId === consultationData.id && (
                  <Pin className="w-3 h-3 text-primary fill-primary" />
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{consultationData.description}</p>
              {consultationData.preferredDate && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mt-1 font-medium">
                  {new Date(consultationData.preferredDate as any).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            {isArtist && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => {
                  const isPinned = conversation?.pinnedConsultationId === consultationData.id;
                  pinConsultationMutation.mutate({
                    conversationId,
                    consultationId: isPinned ? null : consultationData.id
                  });
                }}
              >
                {conversation?.pinnedConsultationId === consultationData.id ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea
          className="h-full px-4 py-4"
          viewportRef={viewportRef}
          onScroll={handleScroll}
        >
          <div className="space-y-4 pb-[182px]">
            {messages && messages.length > 0 ? (
              messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                const isImage = message.messageType === "image";

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
                          onViewDetails={() => handleViewProposal(message, metadata)}
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
            {/* Removed bottomRef div */}
          </div>
        </ScrollArea>
      </div>

      {/* Floating Bottom Input & Actions */}
      {/* Input Bar */}
      <div className="fixed bottom-[110px] left-4 right-4 z-[60]">
        <div className="relative">
          {/* Input Bar */}
          <div className="bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] p-1.5 pl-4 flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button size="icon" variant="ghost" className="shrink-0 h-9 w-9 rounded-full hover:bg-white/10 -ml-2" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-2 h-10 placeholder:text-muted-foreground/50"
              disabled={uploadingImage}
            />
            <Button size="icon" className="shrink-0 h-10 w-10 rounded-full shadow-md" onClick={handleSendMessage} disabled={!messageText.trim() || sendMessageMutation.isPending || uploadingImage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <BookingWizard
        isOpen={showProjectWizard}
        onClose={() => setShowProjectWizard(false)}
        conversationId={conversationId}
        artistServices={availableServices}
        onBookingSuccess={() => {
          setShowProjectWizard(false);
        }}
        overlayName="Booking Wizard"
        overlayId="chat.booking_wizard"
      />

      {/* Book Now Calendar Dialog */}
      <ModalShell
        isOpen={showBookingCalendar}
        onClose={() => setShowBookingCalendar(false)}
        title="Select Date"
        className="max-w-md"
        overlayName="Book Now"
        overlayId="chat.book_now"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={prevMonth}>&lt;</Button>
            <span className="font-semibold">{format(new Date(calendarDays.find(d => d.type === 'day')?.date || new Date()), 'MMMM yyyy')}</span>
            <Button variant="ghost" onClick={nextMonth}>&gt;</Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {calendarDays.map((item, i) => (
              <div key={item.key || i}>
                {item.type === 'empty' || !item.date ? (
                  <div className="h-10" />
                ) : (
                  <Button
                    variant="ghost"
                    className={`h-10 w-full p-0 font-normal ${projectStartDate?.toDateString() === item.date.toDateString()
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "hover:bg-accent"
                      } ${item.date.toDateString() === new Date().toDateString()
                        ? "border border-primary text-primary"
                        : ""
                      }`}
                    onClick={() => {
                      if (item.date) {
                        setProjectStartDate(item.date);
                        toast.info("Date selected: " + format(item.date, 'PPP'));
                      }
                    }}
                  >
                    {item.day}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </ModalShell>


      {/* Client Confirm Dialog */}
      <ModalShell
        isOpen={showClientConfirmDialog}
        onClose={() => setShowClientConfirmDialog(false)}
        title="Confirm Project Dates"
        description="Please review and select the dates you can attend."
        footer={<Button onClick={handleClientConfirmDates}>Confirm Dates</Button>}
        className="max-w-md"
        overlayName="Client Confirm"
        overlayId="chat.client_confirm"
      >
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
      </ModalShell>

      <ClientProfileSheet
        isOpen={showClientInfo}
        onClose={() => setShowClientInfo(false)}
        client={conversation?.otherUser}
      />

      <ProjectProposalModal
        isOpen={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
        metadata={selectedProposal?.metadata}
        isArtist={isArtist}
        onAccept={() => selectedProposal && handleClientAcceptProposal(selectedProposal.message, selectedProposal.metadata)}
        onReject={() => {
          if (selectedProposal) {
            sendMessageMutation.mutate({
              conversationId,
              content: "I'm sorry, those dates don't work for me.",
              messageType: "text"
            });
            setSelectedProposal(null);
          }
        }}
        isPendingAction={bookProjectMutation.isPending}
      />
    </div>
  );
}
