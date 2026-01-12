import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Calendar, ChevronRight, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Consultations() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Form state
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  // Get list of artists for selection
  const { data: artists = [] } = trpc.auth.listArtists.useQuery();

  const { data: consultations, isLoading, refetch } = trpc.consultations.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createConsultationMutation = trpc.consultations.create.useMutation({
    onSuccess: () => {
      toast.success("Consultation request submitted successfully");
      setShowNewDialog(false);
      setSelectedArtistId("");
      setSubject("");
      setDescription("");
      setPreferredDate("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to submit consultation: " + error.message);
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  const handleSubmit = () => {
    if (!selectedArtistId || !subject || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    createConsultationMutation.mutate({
      artistId: selectedArtistId,
      subject,
      description,
      preferredDate: preferredDate || undefined,
    });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "responded":
        return "bg-indigo-500";
      case "scheduled":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Consultations</h1>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Consultation</DialogTitle>
                <DialogDescription>
                  Select an artist and request a consultation appointment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="artist">Select Artist *</Label>
                  <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an artist" />
                    </SelectTrigger>
                    <SelectContent>
                      {artists.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.name || artist.email}
                          {artist.instagramUsername && ` (@${artist.instagramUsername})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Custom tattoo design"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you'd like to discuss..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred-date">Preferred Date (Optional)</Label>
                  <Input
                    id="preferred-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={createConsultationMutation.isPending}
                >
                  {createConsultationMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading consultations...</p>
          </div>
        ) : consultations && consultations.length > 0 ? (
          consultations.map((consultation) => (
            <Card
              key={consultation.id}
              className="overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => {
                if (consultation.conversationId) {
                  setLocation(`/chat/${consultation.conversationId}`);
                } else {
                  // Fallback to conversations list if no direct link (should be rare)
                  setLocation("/conversations");
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{consultation.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      Artist: {consultation.artistId}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(consultation.status)}`}>
                    {getStatusText(consultation.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{consultation.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {consultation.preferredDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(consultation.preferredDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{consultation.createdAt ? new Date(consultation.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {consultation.status === "pending" && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span>Waiting for artist response</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Consultations Yet</h3>
            <p className="text-muted-foreground mb-4">
              Request a consultation to get started
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Request Consultation
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

