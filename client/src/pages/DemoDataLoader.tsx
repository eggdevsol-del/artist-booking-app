import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DemoDataLoader() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const loadDemoMutation = trpc.system.loadDemoData.useMutation({
    onSuccess: () => {
      toast.success("Demo data loaded successfully!");
      // Invalidate all queries to refresh data
      utils.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to load demo data: " + error.message);
    },
  });

  if (!user || (user.role !== "artist" && user.role !== "admin")) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Demo Data</CardTitle>
            <CardDescription className="text-sm">
              Load sample data for testing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will create a test client, conversation with messages, and an
          appointment. Perfect for testing all features.
        </p>
        <Button
          onClick={() => loadDemoMutation.mutate()}
          disabled={loadDemoMutation.isPending}
          variant="outline"
          className="w-full"
        >
          {loadDemoMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Demo Data...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Load Demo Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

