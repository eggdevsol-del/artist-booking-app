import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Mail, MessageCircle, Phone, Plus, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Clients() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { data: conversations, refetch } = trpc.conversations.list.useQuery(
    undefined,
    {
      enabled: !!user && (user.role === "artist" || user.role === "admin"),
    }
  );

  const createConversationMutation = trpc.conversations.getOrCreate.useMutation({
    onSuccess: () => {
      toast.success("Client added successfully");
      setShowAddDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to add client: " + error.message);
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
    if (!loading && user && user.role !== "artist" && user.role !== "admin") {
      setLocation("/conversations");
    }
  }, [user, loading, setLocation]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleAddClient = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // For now, we need a client ID. In production, this would create a user first.
    // As a workaround, we'll show a message that clients need to sign up first
    toast.error("Clients must sign up through the app first. Share the app link with them!");
    setShowAddDialog(false);
    resetForm();
  };

  // Extract unique clients from conversations
  const clients = conversations?.map((conv: any) => ({
    id: conv.clientId || conv.id,
    name: conv.clientName || conv.otherUser?.name || "Unknown",
    email: conv.otherUser?.email || "",
    phone: conv.otherUser?.phone || "",
    lastMessage: conv.lastMessage,
    conversationId: conv.id,
  })).filter((client: any, index: number, self: any[]) => 
    index === self.findIndex((c: any) => c.id === client.id)
  ) || [];

  const filteredClients = clients.filter((client: any) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="mobile-header px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/settings")}
            className="tap-target"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 mobile-scroll overflow-y-auto space-y-4">
        {/* Search and Add */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="tap-target"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">
                {clients.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Clients
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No clients yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first client to get started
                </p>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client: any) => (
              <Card key={client.id} className="hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {client.name}
                        </CardTitle>
                        {client.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/chat/${client.conversationId}`)}
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client profile and start a conversation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddClient}
                disabled={createConversationMutation.isPending}
                className="flex-1"
              >
                {createConversationMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

