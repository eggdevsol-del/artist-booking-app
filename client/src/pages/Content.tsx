import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

export default function Content() {
  const { user, loading } = useAuth();

  const { data: content, isLoading, refetch } = trpc.clientContent.listContent.useQuery(
    { clientId: user?.id || "" },
    { enabled: !!user?.id }
  );

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading content...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="mobile-header px-4 py-4 border-b">
          <h1 className="text-xl font-bold">My Content</h1>
          <p className="text-sm text-muted-foreground">
            Photos and videos from your sessions
          </p>
        </header>

        {/* Content Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          {!content || content.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">No content yet</h2>
              <p className="text-sm text-muted-foreground">
                Your artist will upload photos and videos here after your sessions
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {content.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative aspect-square bg-muted">
                    {item.file_type === "image" ? (
                      <img
                        src={`/api/files/${item.file_key}`}
                        alt={item.title || item.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(`/api/files/${item.file_key}`, item.file_name)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">
                      {item.title || item.file_name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        <BottomNav />
      </div>
    </DashboardLayout>
  );
}

