import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, X, Plus, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed as PWA
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    if (isInStandaloneMode) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('ios-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Show again after 24 hours
    if (dismissedTime > oneDayAgo) {
      return;
    }

    // Only show for iOS devices not in standalone mode
    if (isIOSDevice && !isInStandaloneMode) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  const handleLearnMore = () => {
    // Scroll to show the bottom of the screen where the share button is
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  if (!showPrompt || !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-2 border-primary/20 bg-background/20 backdrop-blur-xl">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Install Artist Booking App
          </CardTitle>
          <CardDescription>
            Add this app to your iPhone home screen for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tap the Share button</p>
                <div className="flex items-center gap-2 mt-1">
                  <Share className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Located at the bottom of Safari
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Select "Add to Home Screen"</p>
                <div className="flex items-center gap-2 mt-1">
                  <Plus className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Scroll down in the share menu
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tap "Add" to confirm</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The app will appear on your home screen
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4">
              <li>• Quick access from home screen</li>
              <li>• Full-screen experience</li>
              <li>• Push notifications for bookings</li>
              <li>• Works offline</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1"
              onClick={handleLearnMore}
            >
              Got It!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

