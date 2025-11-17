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
    icon: "🎨",
    title: "Welcome to Your Artist Dashboard!",
    description:
      "Manage all your client bookings, conversations, and schedule in one place. Everything you need to run your business efficiently.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "💬",
    title: "Chat with Clients Instantly",
    description:
      "Respond to booking inquiries, share updates, and build relationships with your clients through real-time messaging.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: "📅",
    title: "Manage Your Schedule Effortlessly",
    description:
      "View appointments in week or month view, create new bookings, and keep track of all your sessions in one organized calendar.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: "✏️",
    title: "Full Control Over Appointments",
    description:
      "Edit appointment details, update status, manage pricing, and keep everything organized with ease.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: "👥",
    title: "Know Your Clients Better",
    description:
      "Store client notes, preferences, and history to provide personalized service every time.",
    color: "from-indigo-500 to-purple-500",
  },
];

const clientScreens: TutorialScreen[] = [
  {
    icon: "👋",
    title: "Welcome to Easy Booking!",
    description:
      "Book appointments with your favorite artists and stay connected—all in one convenient app.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: "🔍",
    title: "Connect with Artists",
    description:
      "Browse and connect with talented artists, view their work, and start conversations about your next booking.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: "💬",
    title: "Chat Directly with Artists",
    description:
      "Discuss your ideas, ask questions, and get instant responses from artists through our messaging system.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: "📆",
    title: "Book Appointments Seamlessly",
    description:
      "View available times, confirm appointments, and receive notifications—booking has never been easier.",
    color: "from-green-500 to-teal-500",
  },
  {
    icon: "✅",
    title: "Stay Organized",
    description:
      "View all your upcoming and past appointments, receive reminders, and never miss a session.",
    color: "from-purple-500 to-pink-500",
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="tap-target"
        >
          <X className="w-5 h-5" />
        </Button>
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
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
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
            className="flex-1 h-14 text-lg font-semibold"
            onClick={handleNext}
          >
            {currentScreen < tutorialScreens.length - 1
              ? "Next"
              : "Get Started"}
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
