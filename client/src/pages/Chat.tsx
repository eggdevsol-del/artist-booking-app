import { useChatController } from "@/features/chat/useChatController";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingWizard } from "@/features/booking/BookingWizard";
import { ProjectProposalMessage } from "@/components/chat/ProjectProposalMessage";
import { ArrowLeft, Calendar as CalendarIcon, Send, User, Phone, Mail, Cake, ImagePlus, ChevronUp, Check, Pin, PinOff, Zap } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
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
    scrollRef,
    bottomRef,
    hasScrolledRef,

    // Client Confirm State
    showClientConfirmDialog, setShowClientConfirmDialog,
    clientConfirmDates, setClientConfirmDates,

  } = useChatController(conversationId);

  // Local UI Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scrolling Logic
  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (messages && messages.length > 0 && !hasScrolledRef.current) {
      scrollToBottom();
      hasScrolledRef.current = true;
    }
  }, [messages, hasScrolledRef]);

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
        <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
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
                          isPendingAction={bookProjectMutation.isPending}
                          onAccept={() => handleClientAcceptProposal(message, metadata)}
                          onReject={() => {
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
      </div>

      {/* Floating Bottom Input & Actions */}
      <div className="fixed bottom-[110px] left-4 right-4 z-[60]">
        <div className="relative">
          {isArtist && (
            <Sheet>
              <SheetTrigger asChild>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-8 bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg rounded-full flex items-center justify-center cursor-pointer hover:bg-background/80 transition-all group gap-2 z-20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Quick Actions</span>
                  <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2.5rem] border-t-0 p-0 bg-background/95 backdrop-blur-[20px] shadow-2xl max-h-[85vh]">
                <SheetHeader className="px-6 py-4 border-b border-white/5">
                  <SheetTitle className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
                    Quick Actions
                  </SheetTitle>
                </SheetHeader>
                <div className="p-6 grid gap-6">
                  {/* Booking Tools */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2 px-1">
                      <CalendarIcon className="w-3 h-3" /> Booking Tools
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-dashed border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => setShowBookingCalendar(true)}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium">Book Now</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-dashed border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => { setShowProjectWizard(true); }}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold shadow-sm">PRO</span>
                        </div>
                        <span className="text-xs font-medium">Project</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-dashed border-green-500/30 hover:border-green-500 hover:bg-green-500/5 transition-all group" onClick={() => conversationId && toast.info("Use 'Confirm & Book' in chat bubble.")}>
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-xs font-medium">Confirm</span>
                      </Button>
                    </div>
                  </div>

                  {/* Quick Responses */}
                  {quickActions && quickActions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2 px-1">
                        <Zap className="w-3 h-3" /> Saved Responses
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                          <Button
                            key={action.id}
                            variant="secondary"
                            className="justify-start h-auto py-3 px-4 text-xs text-left whitespace-normal leading-relaxed rounded-xl bg-muted/50 hover:bg-muted transition-colors"
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
      />

      {/* Book Now Calendar Dialog */}
      <Dialog open={showBookingCalendar} onOpenChange={setShowBookingCalendar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>


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
              </TabsContent>
              <TabsContent value="media" className="p-1">
                <p className="text-sm text-muted-foreground text-center py-8">No shared media</p>
              </TabsContent>
              <TabsContent value="content" className="p-1">
                <p className="text-sm text-muted-foreground text-center py-8">No shared content</p>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
