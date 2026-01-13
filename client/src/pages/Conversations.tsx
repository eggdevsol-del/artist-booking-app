
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, MessageCircle, User, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Conversations() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: conversations, isLoading } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

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

        {/* PENDING CONSULTS COMMENTED OUT FOR DEBUGGING */}
        {/* 
        {isArtist && pendingConsults && ... }
        */}

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
                      {(() => {
                        const dateStr = conv.lastMessageAt || conv.createdAt;
                        if (!dateStr) return "";
                        const date = new Date(dateStr as any);
                        return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
                      })()}
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
    </div>
  );
}
