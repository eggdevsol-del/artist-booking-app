import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, ChevronRight, MessageCircle, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Conversations() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [viewedConsultations, setViewedConsultations] = useState<Set<number>>(() => {
    const stored = localStorage.getItem('viewedConsultations');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const { data: conversations, isLoading, refetch } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get pending consultation requests for artists
  const { data: pendingConsults } = trpc.consultations.list.useQuery(undefined, {
    enabled: !!user && (user.role === 'artist' || user.role === 'admin'),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const createConversationMutation = trpc.conversations.getOrCreate.useMutation({
    onSuccess: (conversation) => {
      // Navigate to the new conversation
      if (conversation) {
        setLocation(`/chat/${conversation.id}`);
      }
    },
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
        // Auto-create conversation with the referred artist
        createConversationMutation.mutate({ 
          artistId: refArtistId,
          clientId: user.id 
        });
        // Clear the ref parameter from URL
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
    <div className="min-h-screen flex flex-col bg-background pb-20">
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
        {/* Pending Consultation Requests for Artists */}
        {isArtist && pendingConsults && pendingConsults.filter(c => c.status === 'pending').length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">CONSULTATION REQUESTS</h2>
            <div className="space-y-2">
              {pendingConsults.filter(c => c.status === 'pending').map((consult) => (
                <Card
                  key={consult.id}
                  className="p-4 cursor-pointer hover:bg-accent/5 transition-colors border-l-4 border-l-primary"
                  onClick={async () => {
                    // Mark consultation as viewed
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
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!viewedConsultations.has(consult.id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            New Request
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{consult.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{consult.description}</p>
                      {consult.preferredDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Preferred: {new Date(consult.preferredDate as any).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
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
                className="p-4 cursor-pointer hover:bg-accent/5 transition-colors tap-target"
                onClick={() => setLocation(`/chat/${conv.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conv.otherUser?.avatar ? (
                      <img src={conv.otherUser.avatar} alt={conv.otherUser.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {conv.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {conv.otherUser?.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date((conv.lastMessageAt || conv.createdAt) as any).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conv.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                        {conv.unreadCount}
                      </div>
                    )}
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="flex items-center justify-around px-2 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto py-2 px-3 gap-1 bg-purple-600 text-white rounded-lg"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto py-2 px-3 gap-1 bg-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all"
            onClick={() => setLocation("/calendar")}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Calendar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto py-2 px-3 gap-1 bg-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all"
            onClick={() => setLocation("/settings")}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

