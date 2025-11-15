import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronRight, Plus, Trash2, Pencil, Check, X } from "lucide-react";
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState<Service>({ name: "", duration: 60, price: 0, description: "" });

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

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingIndex(null);
  };

  const handleAddService = () => {
    if (!newService.name.trim()) {
      toast.error("Please enter a service name");
      return;
    }
    setServices(prev => [...prev, newService]);
    setNewService({ name: "", duration: 60, price: 0, description: "" });
    setShowAddForm(false);
    toast.success("Service added successfully");
  };

  const handleCancelAdd = () => {
    setNewService({ name: "", duration: 60, price: 0, description: "" });
    setShowAddForm(false);
  };

  const handleEditService = (index: number) => {
    setEditingIndex(index);
    setEditingService({ ...services[index] });
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (!editingService?.name.trim()) {
      toast.error("Please enter a service name");
      return;
    }
    setServices(prev => prev.map((service, i) => 
      i === editingIndex ? editingService : service
    ));
    setEditingIndex(null);
    setEditingService(null);
    toast.success("Service updated successfully");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingService(null);
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
    toast.success("Service removed");
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
              {!showAddForm && (
                <Button size="sm" onClick={handleShowAddForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Service
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Services */}
            {services.map((service, index) => (
              <div key={index} className="p-4 border rounded-lg">
                {editingIndex === index && editingService ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Service Name</Label>
                      <Input
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        placeholder="e.g., Full day sitting"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={editingService.duration}
                          onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={editingService.price}
                          onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={editingService.description}
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                        placeholder="Brief description of the service"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{service.duration} minutes</span>
                          <span>${service.price}</span>
                        </div>
                        {service.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditService(index)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Service Form */}
            {showAddForm && (
              <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                <h3 className="font-semibold">New Service</h3>
                
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., Full day sitting"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 0 })}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Brief description of the service"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddService}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Service
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {services.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-muted-foreground">
                No services added yet. Click "Add Service" to get started.
              </div>
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
