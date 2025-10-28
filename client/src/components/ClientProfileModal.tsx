import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  Mail, 
  Trash2, 
  Save, 
  Upload, 
  StickyNote,
  Image as ImageIcon,
  Video,
  X
} from "lucide-react";
import { compressChatImage } from "@/lib/imageCompression";

interface ClientProfileModalProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientBio?: string;
  isOpen: boolean;
  onClose: () => void;
  onClientDeleted?: () => void;
}

export default function ClientProfileModal({
  clientId,
  clientName,
  clientPhone,
  clientEmail,
  clientBio,
  isOpen,
  onClose,
  onClientDeleted,
}: ClientProfileModalProps) {
  const [name, setName] = useState(clientName);
  const [phone, setPhone] = useState(clientPhone || "");
  const [bio, setBio] = useState(clientBio || "");
  const [newNote, setNewNote] = useState("");
  const [uploadingContent, setUploadingContent] = useState(false);
  // fileInputRef removed - now using label-based file input

  const utils = trpc.useUtils();

  // Queries
  const { data: notes, refetch: refetchNotes } = trpc.clientContent.getNotes.useQuery(
    { clientId },
    { enabled: isOpen }
  );

  const { data: content, refetch: refetchContent } = trpc.clientContent.listContent.useQuery(
    { clientId },
    { enabled: isOpen }
  );

  // Mutations
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.conversations.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const saveNoteMutation = trpc.clientContent.saveNote.useMutation({
    onSuccess: () => {
      toast.success("Note saved");
      setNewNote("");
      refetchNotes();
    },
    onError: (error) => {
      toast.error("Failed to save note: " + error.message);
    },
  });

  const deleteNoteMutation = trpc.clientContent.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      refetchNotes();
    },
  });

  const uploadContentMutation = trpc.clientContent.uploadContent.useMutation({
    onSuccess: () => {
      toast.success("Content uploaded");
      setUploadingContent(false);
      refetchContent();
    },
    onError: (error) => {
      toast.error("Failed to upload: " + error.message);
      setUploadingContent(false);
    },
  });

  const deleteContentMutation = trpc.clientContent.deleteContent.useMutation({
    onSuccess: () => {
      toast.success("Content deleted");
      refetchContent();
    },
  });

  const deleteClientMutation = trpc.clientContent.deleteClient.useMutation({
    onSuccess: () => {
      toast.success("Client deleted");
      onClose();
      if (onClientDeleted) onClientDeleted();
    },
    onError: (error) => {
      toast.error("Failed to delete client: " + error.message);
    },
  });

  const handleSaveProfile = () => {
    // Note: This updates the client's profile, requires proper authorization
    updateProfileMutation.mutate({
      name,
      phone,
      bio,
    });
  };

  const handleSaveNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    saveNoteMutation.mutate({
      clientId,
      note: newNote,
    });
  };

  const handleDeleteNote = (noteId: number) => {
    if (confirm("Delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be less than 50MB");
      return;
    }

    setUploadingContent(true);
    toast.info("Uploading content...");

    try {
      let fileData: string;

      if (isImage) {
        // Compress images
        fileData = await compressChatImage(file);
      } else {
        // For videos, convert to base64 directly (no compression)
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      uploadContentMutation.mutate({
        clientId,
        fileName: file.name,
        fileData,
        contentType: file.type,
        fileType: isImage ? "image" : "video",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to process file");
      setUploadingContent(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteContent = (contentId: number) => {
    if (confirm("Delete this content?")) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const handleDeleteClient = () => {
    if (confirm(`Are you sure you want to delete ${clientName}? This will delete all conversations, messages, and content.`)) {
      deleteClientMutation.mutate(clientId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {clientEmail && (
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{clientEmail}</p>
                </div>
              )}

              <div>
                <Label htmlFor="bio">Notes / Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteClient}
                  disabled={deleteClientMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Client
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newNote">Add Note</Label>
                <Textarea
                  id="newNote"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a private note about this client..."
                  rows={3}
                />
                <Button
                  onClick={handleSaveNote}
                  disabled={saveNoteMutation.isPending}
                  className="w-full"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Save Note
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Previous Notes</Label>
                {!notes || notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No notes yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note: any) => (
                      <Card key={note.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploadingContent}
                    className="hidden"
                  />
                  <div className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${uploadingContent ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingContent ? "Uploading..." : "Upload Photo/Video"}
                  </div>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 50MB. Images will be compressed automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Uploaded Content</Label>
                {!content || content.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No content uploaded yet
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {content.map((item: any) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square bg-muted rounded overflow-hidden">
                          {item.file_type === "image" ? (
                            <img
                              src={`/api/files/${item.file_key}`}
                              alt={item.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteContent(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

