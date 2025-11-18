import { Calendar, Percent, Image, Bell, Zap, X } from "lucide-react";

interface OnboardingBenefitsProps {
  role: "artist" | "client";
  onClose: () => void;
}

export function OnboardingBenefits({ role, onClose }: OnboardingBenefitsProps) {
  const benefits = role === "artist" ? [
    {
      icon: Calendar,
      title: "Instant Multi-Day Booking",
      description: "Book entire projects in one conversation. No more endless back-and-forth scheduling multiple sessions.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Percent,
      title: "Private Promotions",
      description: "Offer exclusive deals to select clients without posting publicly. Preserve your social proof and perceived value.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Image,
      title: "Built-In Image Messaging",
      description: "Send and receive reference photos, progress updates, and final results directly in chat. No more juggling apps.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Bell,
      title: "Custom Reminders",
      description: "Push notifications, SMS, and email reminders. Your clients never miss appointments—you never lose money.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Marketing Automation",
      description: "Set up aftercare tips, rebooking reminders, and promotions once. They run forever. Focus on your art, not admin.",
      color: "from-yellow-500 to-amber-500"
    }
  ] : [
    {
      icon: Calendar,
      title: "Book Multi-Day Projects Instantly",
      description: "Need multiple sessions? Book them all at once. See your artist's availability and lock in your dates in seconds.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Percent,
      title: "Exclusive Private Deals",
      description: "Get special offers and promotions sent directly to you. VIP treatment without the public announcement.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Image,
      title: "Share Images Directly",
      description: "Send reference photos, inspiration, and ideas right in the chat. No more email attachments or lost messages.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Bell,
      title: "Never Miss an Appointment",
      description: "Get reminders via push notification, text, and email. You choose how you want to be reminded.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Automated Updates",
      description: "Receive aftercare instructions, rebooking reminders, and special offers automatically. Stay connected effortlessly.",
      color: "from-yellow-500 to-amber-500"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {role === "artist" ? "Why Artists Love This App" : "Why Clients Love This App"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Everything other scheduling apps are missing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="p-6 space-y-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started →
          </button>
          <p className="text-xs text-center text-gray-500 mt-3">
            These features are available now. Start using them today.
          </p>
        </div>
      </div>
    </div>
  );
}
