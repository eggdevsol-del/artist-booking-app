import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Calendar, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FindNextModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  onSendDates: (dates: string[], service: any) => void;
}

interface Service {
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface WorkSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

type FrequencyType = "weekly" | "biweekly" | "monthly" | "custom";

export default function FindNextModal({
  open,
  onClose,
  conversationId,
  onSendDates,
}: FindNextModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [numberOfSessions, setNumberOfSessions] = useState<number>(1);
  const [frequency, setFrequency] = useState<FrequencyType>("weekly");
  const [customDays, setCustomDays] = useState<number>(7);
  const [proposedDates, setProposedDates] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);

  const { data: artistSettings, isLoading: settingsLoading } = trpc.artistSettings.get.useQuery(undefined, {
    enabled: !!user && user.role === "artist" && open,
  });

  const { data: appointments, isLoading: appointmentsLoading } = trpc.appointments.list.useQuery(undefined, {
    enabled: !!user && user.role === "artist" && open,
  });

  // Parse services from artist settings
  useEffect(() => {
    if (artistSettings?.services) {
      try {
        const parsed = JSON.parse(artistSettings.services);
        if (Array.isArray(parsed)) {
          setAvailableServices(parsed);
        }
      } catch (e) {
        console.error("Failed to parse services", e);
      }
    }
  }, [artistSettings]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedService(null);
      setNumberOfSessions(1);
      setFrequency("weekly");
      setCustomDays(7);
      setProposedDates([]);
    }
  }, [open]);

  const getDaysBetween = (freq: FrequencyType, custom: number): number => {
    switch (freq) {
      case "weekly":
        return 7;
      case "biweekly":
        return 14;
      case "monthly":
        return 30;
      case "custom":
        return custom;
      default:
        return 7;
    }
  };

  const isDateTimeAvailable = (
    checkDate: Date,
    duration: number,
    existingAppointments: any[]
  ): boolean => {
    const checkStart = checkDate.getTime();
    const checkEnd = checkStart + duration * 60 * 1000;

    for (const apt of existingAppointments) {
      const aptDate = new Date(apt.date);
      const aptStart = aptDate.getTime();
      const aptEnd = aptStart + (apt.duration || 60) * 60 * 1000;

      // Check for overlap
      if (
        (checkStart >= aptStart && checkStart < aptEnd) ||
        (checkEnd > aptStart && checkEnd <= aptEnd) ||
        (checkStart <= aptStart && checkEnd >= aptEnd)
      ) {
        return false;
      }
    }

    return true;
  };

  const findAvailableDates = () => {
    if (!selectedService) {
      toast.error("Please select a service first");
      return;
    }
    
    if (!artistSettings) {
      toast.error("Artist settings not loaded. Please try again.");
      return;
    }
    
    if (!artistSettings.workSchedule) {
      toast.error("Work schedule not configured. Please set up your work hours in Settings.");
      return;
    }
    
    // Appointments can be empty array, that's fine
    const appointmentsList = appointments || [];

    setIsCalculating(true);

    try {
      // Parse work schedule
      let workSchedule: WorkSchedule;
      try {
        workSchedule = JSON.parse(artistSettings.workSchedule || "{}");
      } catch {
        toast.error("Invalid work schedule configuration");
        setIsCalculating(false);
        return;
      }

      const daysBetween = getDaysBetween(frequency, customDays);
      const foundDates: string[] = [];
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

      const maxAttempts = 365; // Don't search beyond 1 year
      let attempts = 0;

      while (foundDates.length < numberOfSessions && attempts < maxAttempts) {
        attempts++;

        // Get day name
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dayName = dayNames[currentDate.getDay()] as keyof WorkSchedule;
        const daySchedule = workSchedule[dayName];

        // Check if artist works on this day
        if (daySchedule && daySchedule.enabled) {
          // Parse start time
          const [startHour, startMinute] = daySchedule.start.split(":").map(Number);
          const proposedDateTime = new Date(currentDate);
          proposedDateTime.setHours(startHour, startMinute, 0, 0);

          // Check if this time slot is available
          if (
            isDateTimeAvailable(
              proposedDateTime,
              selectedService.duration,
              appointmentsList
            )
          ) {
            foundDates.push(proposedDateTime.toISOString());

            // Move to next date based on frequency
            currentDate.setDate(currentDate.getDate() + daysBetween);
          } else {
            // Try next day if this slot is taken
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          // Move to next day if artist doesn't work on this day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      if (foundDates.length < numberOfSessions) {
        toast.warning(
          `Could only find ${foundDates.length} available slots out of ${numberOfSessions} requested`
        );
      }

      setProposedDates(foundDates);
      setStep(4); // Move to review step
    } catch (error) {
      console.error("Error finding dates:", error);
      toast.error("Failed to find available dates");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSendDates = () => {
    if (proposedDates.length === 0 || !selectedService) {
      toast.error("No dates to send");
      return;
    }

    onSendDates(proposedDates, selectedService);
    onClose();
    toast.success("Dates sent to client");
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Find Next Appointments</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {step === 1 && "Select Service"}
            {step === 2 && "Number of Sessions"}
            {step === 3 && "Frequency"}
            {step === 4 && "Review & Send"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Select Service</Label>
              <RadioGroup
                value={selectedService?.name || ""}
                onValueChange={(value) => {
                  const service = availableServices.find((s) => s.name === value);
                  setSelectedService(service || null);
                }}
              >
                {availableServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No services configured. Please add services in Settings.
                  </p>
                ) : (
                  availableServices.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedService(service)}
                    >
                      <RadioGroupItem value={service.name} id={service.name} />
                      <Label
                        htmlFor={service.name}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.duration} min • ${service.price}
                        </div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {service.description}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Number of Sessions */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessions">Number of Appointments</Label>
                <Input
                  id="sessions"
                  type="number"
                  min="1"
                  max="20"
                  value={numberOfSessions}
                  onChange={(e) =>
                    setNumberOfSessions(parseInt(e.target.value) || 1)
                  }
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  How many appointments do you want to schedule?
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Frequency */}
          {step === 3 && (
            <div className="space-y-4">
              <Label>Frequency Between Bookings</Label>
              <RadioGroup
                value={frequency}
                onValueChange={(value) => setFrequency(value as FrequencyType)}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                    Weekly (7 days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="biweekly" id="biweekly" />
                  <Label htmlFor="biweekly" className="flex-1 cursor-pointer">
                    Bi-weekly (14 days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    Monthly (30 days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex-1 cursor-pointer">
                    Custom
                  </Label>
                </div>
              </RadioGroup>

              {frequency === "custom" && (
                <div className="mt-4">
                  <Label htmlFor="customDays">Days Between Appointments</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="1"
                    max="90"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 7)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Send */}
          {step === 4 && (
            <div className="space-y-4">
              {isCalculating ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">
                    Finding available dates...
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-accent rounded-lg p-4 space-y-2">
                    <div className="font-medium">{selectedService?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedService?.duration} minutes • ${selectedService?.price}
                    </div>
                    <div className="text-sm">
                      {proposedDates.length} appointments scheduled
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Proposed Dates</Label>
                    {proposedDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 border rounded-lg p-3"
                      >
                        <Calendar className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">Session {index + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(date)}
                          </div>
                        </div>
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between gap-2 mt-4">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}

          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedService}
              className="ml-auto"
            >
              Next
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={() => setStep(3)}
              disabled={numberOfSessions < 1}
              className="ml-auto"
            >
              Next
            </Button>
          )}

          {step === 3 && (
            <Button 
              onClick={findAvailableDates} 
              className="ml-auto"
              disabled={settingsLoading || appointmentsLoading}
            >
              {settingsLoading || appointmentsLoading ? "Loading..." : "Find Dates"}
            </Button>
          )}

          {step === 4 && !isCalculating && (
            <Button
              onClick={handleSendDates}
              disabled={proposedDates.length === 0}
              className="ml-auto"
            >
              Send Dates
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

