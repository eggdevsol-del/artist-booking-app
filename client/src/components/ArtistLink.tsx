import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ArtistLinkProps {
  artistId: string;
  artistName: string;
}

export default function ArtistLink({ artistId, artistName }: ArtistLinkProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the artist referral link
  const baseUrl = window.location.origin;
  const artistLink = `${baseUrl}?ref=${artistId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artistLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book with ${artistName}`,
          text: `Connect with me on our booking app!`,
          url: artistLink,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Your Artist Link</CardTitle>
            <CardDescription className="text-sm">
              Share this link to connect with new clients
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={artistLink}
            readOnly
            className="bg-muted font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <Button
          variant="default"
          className="w-full"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Link
        </Button>

        <p className="text-xs text-muted-foreground">
          When clients sign up using this link, they'll automatically be connected to you
        </p>
      </CardContent>
    </Card>
  );
}

