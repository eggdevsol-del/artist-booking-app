import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Clock, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type DaySchedule = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type Service = {
  id?: number;
  name: string;
  duration: number;
  price: number;
  description: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WorkHours() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Work hours state
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
    }))
  );

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({
    name: "",
    duration: 60,
    price: 0,
    description: "",
  });
  const [showAddService, setShowAddService] = useState(false);

  const { data: settings, refetch } = trpc.artistSettings.get.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  const updateSettingsMutation = trpc.artistSettings.upsert.useMutation({
    onSuccess: () => {
      toast.success("Work hours saved successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
    if (!loading && user && user.role !== "artist" && user.role !== "admin") {
      setLocation("/conversations");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (settings?.workSchedule) {
      try {
        const parsed = JSON.parse(settings.workSchedule);
        if (Array.isArray(parsed)) {
          setSchedule(parsed);
        }
      } catch (e) {
        console.error("Failed to parse work hours");
      }
    }

    if (settings?.services) {
      try {
        const parsed = JSON.parse(settings.services);
        if (Array.isArray(parsed)) {
          setServices(parsed);
        }
      } catch (e) {
        console.error("Failed to parse services");
      }
    }
  }, [settings]);

  const handleSaveWorkHours = () => {
    updateSettingsMutation.mutate({
      workSchedule: JSON.stringify(schedule),
      services: settings?.services || JSON.stringify([]),
    });
  };

  const handleSaveServices = () => {
    updateSettingsMutation.mutate({
      workSchedule: settings?.workSchedule || JSON.stringify([]),
      services: JSON.stringify(services),
    });
  };

  const handleToggleDay = (index: number) => {
    const updated = [...schedule];
    updated[index].enabled = !updated[index].enabled;
    setSchedule(updated);
  };

  const handleTimeChange = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleAddService = () => {
    if (!newService.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setServices([...services, { ...newService, id: Date.now() }]);
    setNewService({
      name: "",
      duration: 60,
      price: 0,
      description: "",
    });
    setShowAddService(false);
    toast.success("Service added");
  };

  const handleRemoveService = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
    toast.success("Service removed");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="mobile-header px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/settings")}
            className="tap-target"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Work Hours & Services
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto space-y-6 pb-safe">
        {/* Work Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Hours
            </CardTitle>
            <CardDescription>
              Set your available days and working hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.map((day, index) => (
              <div
                key={day.day}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Switch
                  checked={day.enabled}
                  onCheckedChange={() => handleToggleDay(index)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{day.day}</p>
                </div>
                {day.enabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        handleTimeChange(index, "startTime", e.target.value)
                      }
                      className="w-24 h-8 text-xs"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        handleTimeChange(index, "endTime", e.target.value)
                      }
                      className="w-24 h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}

            <Button
              onClick={handleSaveWorkHours}
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Work Hours"}
            </Button>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Manage your services and pricing
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddService(true)}
                className="tap-target"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No services added yet
              </p>
            ) : (
              services.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {service.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-muted-foreground">
                          {service.duration} min
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          ${service.price}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveService(service.id!)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}

            {showAddService && (
              <Card className="p-4 border-primary">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="serviceName">Service Name *</Label>
                    <Input
                      id="serviceName"
                      value={newService.name}
                      onChange={(e) =>
                        setNewService({ ...newService, name: e.target.value })
                      }
                      placeholder="e.g., Custom Tattoo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serviceDescription">Description</Label>
                    <Textarea
                      id="serviceDescription"
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="serviceDuration">Duration (min)</Label>
                      <Input
                        id="serviceDuration"
                        type="number"
                        value={newService.duration}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            duration: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="servicePrice">Price ($)</Label>
                      <Input
                        id="servicePrice"
                        type="number"
                        value={newService.price}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddService} className="flex-1">
                      Add Service
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddService(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {services.length > 0 && (
              <Button
                onClick={handleSaveServices}
                disabled={updateSettingsMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Services
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

