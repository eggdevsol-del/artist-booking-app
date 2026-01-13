
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, ChevronDown, ChevronRight, MessageCircle, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Conversations() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: conversations, isLoading, refetch } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Get pending consultation requests for artists
  const { data: pendingConsults, refetch: refetchPending } = trpc.consultations.list.useQuery(undefined, {
    enabled: !!user && (user.role === 'artist' || user.role === 'admin'),
    refetchInterval: 10000,
  });

  const [viewedConsultations, setViewedConsultations] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('viewedConsultations');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      console.error("Failed to parse viewedConsultations", e);
      return new Set();
    }
  });

  const [isConsultationsOpen, setIsConsultationsOpen] = useState(true);

  const createConversationMutation = trpc.conversations.getOrCreate.useMutation({
    onSuccess: (conversation) => {
      if (conversation) {
        setLocation(`/chat/${conversation.id}`);
      }
    },
  });

  const updateConsultationMutation = trpc.consultations.update.useMutation({
    onSuccess: () => {
      refetch();
      refetchPending();
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  // Handle artist referral link
  useEffect(() => {
    if (user && user.role === 'client') {
      const params = new URLSearchParams(window.location.search);
      const refArtistId = params.get('ref');

      if (refArtistId && user.id) {
        createConversationMutation.mutate({
          artistId: refArtistId,
          clientId: user.id
        });
        window.history.replaceState({}, '', '/conversations');
      }
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const isArtist = user?.role === "artist" || user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="mobile-header px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Conversations List */}
      <main className="flex-1 px-4 py-4 mobile-scroll">

        {isArtist && pendingConsults && pendingConsults.filter(c => c.status === 'pending' && !c.viewed).length > 0 && (
          <Collapsible
            open={isConsultationsOpen}
            onOpenChange={setIsConsultationsOpen}
            className="mb-6 space-y-2"
          >
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-xs font-bold text-white/40 tracking-widest uppercase">Consultation Requests</h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-white/10 text-white/60">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isConsultationsOpen ? '' : '-rotate-90'}`} />
                  <span className="sr-only">Toggle Consultations</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="space-y-2">
              {pendingConsults
                .filter(c => c.status === 'pending' && !c.viewed)
                .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
                .map((consult) => (
                  <Card
                    key={consult.id}
                    className="p-5 cursor-pointer transition-all duration-300 border-0 bg-gradient-to-r from-[#5b4eff]/20 to-[#5b4eff]/5 backdrop-blur-xl rounded-[2.5rem] relative group border border-white/10 hover:border-[#5b4eff]/30 shadow-lg"
                    onClick={async () => {
                      // Mark consultation as viewed immediately
                      updateConsultationMutation.mutate({
                        id: consult.id,
                        viewed: 1
                      });

                      try {
                        // Local optimistic update (keep existing logic)
                        const newViewed = new Set(viewedConsultations);
                        newViewed.add(consult.id);
                        setViewedConsultations(newViewed);
                        localStorage.setItem('viewedConsultations', JSON.stringify(Array.from(newViewed)));

                        // Create or get conversation with this client
                        const result = await createConversationMutation.mutateAsync({
                          clientId: consult.clientId,
                          artistId: consult.artistId,
                        });
                        if (result) {
                          setLocation(`/chat/${result.id}?consultationId=${consult.id}`);
                        }
                      } catch (e) {
                        console.error("Error clicking card", e);
                      }
                    }}
                  >
                    {/* Glowing effect on hover */}
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-[#5b4eff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#5b4eff] animate-pulse shadow-[0_0_8px_#5b4eff]" />
                          <h3 className="font-bold text-white text-base truncate pr-2">{consult.subject} - {consult.client?.name || 'Client'}</h3>
                        </div>
                        <p className="text-sm text-white/60 line-clamp-2 leading-relaxed pl-4">{consult.description}</p>
                        {consult.preferredDate && !isNaN(new Date(consult.preferredDate as any).getTime()) && (
                          <p className="text-xs font-mono text-[#5b4eff] mt-2 pl-4 font-medium opacity-90">
                            Requested for: {new Date(consult.preferredDate as any).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#5b4eff] group-hover:text-white transition-colors duration-300">
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white" />
                      </div>
                    </div>
                  </Card>
                ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Request Consult Button for Clients */}
        {!isArtist && (
          <div className="mb-6">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold shadow-lg"
              onClick={() => setLocation("/consultations")}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Request Consultation
            </Button>
          </div>
        )}

        {!conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No conversations yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {isArtist
                ? "When clients message you, they'll appear here"
                : "Start a conversation with an artist to book appointments"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="group relative p-4 pr-6 cursor-pointer border-0 bg-white/5 backdrop-blur-md rounded-[3rem] transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] border border-white/5 hover:border-white/10"
                onClick={() => setLocation(`/chat/${conv.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg ring-2 ring-white/5">
                    {conv.otherUser?.avatar ? (
                      <img src={conv.otherUser.avatar} alt={conv.otherUser.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {conv.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-bold text-white text-lg truncate tracking-tight">
                        {conv.otherUser?.name || "Unknown User"}
                      </h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                        {(() => {
                          const dateStr = conv.lastMessageAt || conv.createdAt;
                          if (!dateStr) return "";
                          const date = new Date(dateStr as any);
                          return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
                        })()}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-white/50 truncate flex items-center gap-2">
                      {conv.unreadCount > 0 ? <span className="w-2 h-2 rounded-full bg-primary inline-block" /> : null}
                      Click to view messages
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-center">
                    {conv.unreadCount > 0 && (
                      <div className="bg-primary text-white shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {conv.unreadCount}
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
