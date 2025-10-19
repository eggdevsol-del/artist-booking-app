import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WorkHoursAndServicesProps {
  onBack: () => void;
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

interface Service {
  name: string;
  duration: number;
  price: number;
  description: string;
}

const defaultSchedule: WorkSchedule = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

export default function WorkHoursAndServices({ onBack }: WorkHoursAndServicesProps) {
  const { user } = useAuth();
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(defaultSchedule);
  const [services, setServices] = useState<Service[]>([]);

  const { data: artistSettings } = trpc.artistSettings.get.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  const upsertMutation = trpc.artistSettings.upsert.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  useEffect(() => {
    if (artistSettings) {
      if (artistSettings.workSchedule) {
        try {
          const parsedSchedule = JSON.parse(artistSettings.workSchedule);
          // Validate that all days exist
          if (parsedSchedule && typeof parsedSchedule === 'object') {
            setWorkSchedule({ ...defaultSchedule, ...parsedSchedule });
          }
        } catch (e) {
          console.error("Failed to parse work schedule", e);
          setWorkSchedule(defaultSchedule);
        }
      }

      if (artistSettings.services) {
        try {
          const parsedServices = JSON.parse(artistSettings.services);
          if (Array.isArray(parsedServices)) {
            setServices(parsedServices);
          }
        } catch (e) {
          console.error("Failed to parse services", e);
        }
      }
    }
  }, [artistSettings]);

  const handleDayToggle = (day: keyof WorkSchedule) => {
    setWorkSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const handleTimeChange = (day: keyof WorkSchedule, field: 'start' | 'end', value: string) => {
    setWorkSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleAddService = () => {
    setServices(prev => [...prev, { name: "", duration: 60, price: 0, description: "" }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: string | number) => {
    setServices(prev => prev.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    ));
  };

  const handleSave = () => {
    if (artistSettings) {
      upsertMutation.mutate({
        businessName: artistSettings.businessName || undefined,
        businessAddress: artistSettings.businessAddress || undefined,
        bsb: artistSettings.bsb || undefined,
        accountNumber: artistSettings.accountNumber || undefined,
        depositAmount: artistSettings.depositAmount || undefined,
        workSchedule: JSON.stringify(workSchedule),
        services: JSON.stringify(services),
      });
    }
  };

  const days: Array<{ key: keyof WorkSchedule; label: string }> = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <header className="mobile-header px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Work Hours & Services</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 mobile-scroll space-y-6">
        {/* Work Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Work Schedule</CardTitle>
            <CardDescription>Set your available hours for each day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {days.map(({ key, label }) => {
              const daySchedule = workSchedule[key] || { enabled: false, start: "09:00", end: "17:00" };
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">{label}</Label>
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={() => handleDayToggle(key)}
                    />
                  </div>
                  {daySchedule.enabled && (
                    <div className="flex gap-2 ml-4">
                      <div className="flex-1">
                        <Input
                          type="time"
                          value={daySchedule.start}
                          onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                        />
                      </div>
                      <span className="flex items-center text-muted-foreground">to</span>
                      <div className="flex-1">
                        <Input
                          type="time"
                          value={daySchedule.end}
                          onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>Manage the services you offer</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddService}>
                <Plus className="w-4 h-4 mr-1" />
                Add Service
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services added yet. Click "Add Service" to get started.
              </div>
            ) : (
              services.map((service, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveService(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>

                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      placeholder="e.g., Full day sitting"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={service.duration}
                        onChange={(e) => handleServiceChange(index, 'duration', parseInt(e.target.value) || 0)}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', parseInt(e.target.value) || 0)}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      placeholder="Brief description of the service"
                      rows={2}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={upsertMutation.isPending}
        >
          {upsertMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </main>
    </div>
  );
}

