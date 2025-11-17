import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useState } from "react";

interface OnboardingTutorialProps {
  onComplete: () => void;
  userRole: "artist" | "client";
}

interface TutorialScreen {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const artistScreens: TutorialScreen[] = [
  {
    icon: "💸",
    title: "Stop Losing Money on No-Shows",
    description:
      "Artists lose 30% of revenue to no-shows and cancellations. Automated reminders mean clients actually show up—and you get paid.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: "⏱️",
    title: "Book Clients in 60 Seconds, Not 3 Days",
    description:
      "Stop the endless back-and-forth. Chat + Calendar in ONE screen = instant booking. What used to take 20 messages now takes one.",
    color: "from-blue-500 to-purple-500",
  },
  {
    icon: "🔔",
    title: "Set It Once, Market Forever",
    description:
      "Send aftercare tips, rebooking reminders, and promotions automatically. Your clients stay engaged while you focus on your art—not admin work.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: "📊",
    title: "Turn One-Time Clients Into Regulars",
    description:
      "Automated 'time for your next session' messages bring clients back. More repeat bookings = predictable income without chasing anyone.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: "🎯",
    title: "Everything You Need. Nothing You Don't.",
    description:
      "Chat, calendar, reminders, and client history—all in one app. Stop juggling Instagram DMs, Google Calendar, and sticky notes. Start winning.",
    color: "from-yellow-500 to-amber-500",
  },
];

const clientScreens: TutorialScreen[] = [
  {
    icon: "✅",
    title: "Book in Seconds. Seriously.",
    description:
      "No more waiting days for a response. Chat with your artist and lock in your appointment instantly—all in one conversation.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: "💡",
    title: "See Their Calendar. Pick Your Time.",
    description:
      "No more 'What times work for you?' back-and-forth. See available slots, choose what fits your schedule, done. It's that simple.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: "📱",
    title: "Never Miss Your Appointment Again",
    description:
      "Get reminders before your session, aftercare tips after, and rebooking nudges when it's time. Stay on track effortlessly.",
    color: "from-cyan-500 to-teal-500",
  },
  {
    icon: "⭐",
    title: "Your Artist Knows You",
    description:
      "All your preferences, past appointments, and conversations in one place. Every visit feels personalized because your artist remembers everything.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "🎉",
    title: "Booking Shouldn't Be Hard. Now It Isn't.",
    description:
      "One app. One conversation. One click. That's how booking should work. Welcome to the easiest way to connect with artists.",
    color: "from-yellow-500 to-orange-500",
  },
];

export default function OnboardingTutorial({
  onComplete,
  userRole,
}: OnboardingTutorialProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const tutorialScreens = userRole === "artist" ? artistScreens : clientScreens;

  const handleNext = () => {
    if (currentScreen < tutorialScreens.length - 1) {
      setDirection("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentScreen(currentScreen + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setDirection("backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentScreen(currentScreen - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleDotClick = (index: number) => {
    if (index !== currentScreen) {
      setDirection(index > currentScreen ? "forward" : "backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentScreen(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  const screen = tutorialScreens[currentScreen];
  const isLastScreen = currentScreen === tutorialScreens.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Skip button with FOMO tooltip */}
      <div className="absolute top-4 right-4 z-10 group">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="tap-target"
          title="Skip (but you'll miss the best parts)"
        >
          <X className="w-5 h-5" />
        </Button>
        <span className="absolute top-12 right-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-popover px-2 py-1 rounded shadow-lg">
          Skip (but you'll miss the best parts)
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div
          className={`w-full max-w-md transition-all duration-300 ${
            isAnimating 
              ? direction === "forward"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${screen.color} flex items-center justify-center shadow-2xl animate-bounce-slow`}
            >
              <div className="text-6xl">{screen.icon}</div>
            </div>
          </div>

          {/* Content */}
          <Card className="p-8 text-center space-y-4 border-2 shadow-xl">
            <h2 className="text-2xl font-bold text-foreground">
              {screen.title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {screen.description}
            </p>
          </Card>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 py-8 space-y-4 mobile-safe-area">
        {/* Progress dots with motivational text */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex justify-center gap-2">
            {tutorialScreens.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentScreen
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted hover:bg-muted-foreground/30"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentScreen + 1} of {tutorialScreens.length} reasons you'll love this
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {currentScreen > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-14 text-lg font-semibold"
              onClick={handlePrevious}
            >
              Previous
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            onClick={handleNext}
          >
            {isLastScreen
              ? userRole === "artist"
                ? "Start Winning 🚀"
                : "Let's Go! 🎉"
              : "Show Me More →"}
          </Button>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
