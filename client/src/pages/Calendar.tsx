import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type ViewMode = "month" | "week";

export default function Calendar() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showAppointmentDetailDialog, setShowAppointmentDetailDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    status: "scheduled" as const,
  });

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery(
    {
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    {
      enabled: !!user,
    }
  );

  const { data: conversations } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  // Extract unique clients from conversations
  const clients = conversations?.map((conv: any) => ({
    id: conv.clientId,
    name: conv.clientName,
    email: conv.otherUser?.email,
  })).filter((client: any, index: number, self: any[]) => 
    index === self.findIndex((c: any) => c.id === client.id)
  ) || [];

  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Appointment created successfully");
      setShowAppointmentDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to create appointment: " + error.message);
    },
  });

  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated successfully");
      setShowAppointmentDetailDialog(false);
      setSelectedAppointment(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to update appointment: " + error.message);
    },
  });

  const deleteAppointmentMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      toast.success("Appointment deleted successfully");
      setShowAppointmentDetailDialog(false);
      setSelectedAppointment(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to delete appointment: " + error.message);
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const resetForm = () => {
    setAppointmentForm({
      clientId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
    });
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    if (user?.role === "artist" || user?.role === "admin") {
      setSelectedDate(date);
      const dateStr = date.toISOString().split("T")[0];
      setAppointmentForm({
        ...appointmentForm,
        startTime: `${dateStr}T09:00`,
        endTime: `${dateStr}T10:00`,
      });
      setShowAppointmentDialog(true);
    }
  };

  const handleCreateAppointment = () => {
    if (!appointmentForm.clientId || !appointmentForm.title || !appointmentForm.startTime || !appointmentForm.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    createAppointmentMutation.mutate({
      conversationId: 0,
      artistId: user!.id,
      clientId: appointmentForm.clientId,
      title: appointmentForm.title,
      description: appointmentForm.description,
      startTime: new Date(appointmentForm.startTime),
      endTime: new Date(appointmentForm.endTime),
    });
  };

  const goToPreviousPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDays = () => {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDay; i++) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (startDay - i));
      days.push(date);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const isArtist = user?.role === "artist" || user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="mobile-header px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <Button
            size="sm"
            variant="default"
            onClick={goToToday}
            className="tap-target"
          >
            Today
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousPeriod}
          className="tap-target"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <h2 className="text-lg font-semibold text-foreground">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextPeriod}
          className="tap-target"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* View Toggle */}
      <div className="px-4 py-3 flex gap-2">
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          onClick={() => setViewMode("week")}
          className="flex-1"
        >
          Week
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          onClick={() => setViewMode("month")}
          className="flex-1"
        >
          Month
        </Button>
      </div>

      {/* Calendar Content */}
      <main className="flex-1 px-4 py-4 mobile-scroll overflow-y-auto">
        {viewMode === "week" ? (
          <div className="space-y-3">
            {getWeekDays().map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              return (
                <Card
                  key={day.toISOString()}
                  className={`p-4 min-h-[120px] cursor-pointer hover:bg-accent/5 transition-colors ${
                    isToday(day) ? "border-primary border-2" : ""
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {day.getDate()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {dayAppointments.length} appointment
                        {dayAppointments.length !== 1 ? "s" : ""}
                      </p>
                      {isArtist && (
                        <Plus className="w-4 h-4 text-primary mt-1" />
                      )}
                    </div>
                  </div>

                  {dayAppointments.length > 0 ? (
                    <div className="space-y-2">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-2 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                            setShowAppointmentDetailDialog(true);
                          }}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {apt.serviceName || apt.title}
                          </p>
                          {apt.clientName && (
                            <p className="text-xs text-muted-foreground">
                              {apt.clientName}
                            </p>
                          )}
                          {apt.price && (
                            <p className="text-xs text-primary font-medium">
                              ${apt.price}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(apt.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm">
                      No appointments
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            {getMonthDays().map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day);
              return (
                <Card
                  key={index}
                  className={`aspect-square p-2 cursor-pointer hover:bg-accent/5 transition-colors ${
                    isToday(day) ? "border-primary border-2" : ""
                  } ${!isCurrentMonth(day) ? "opacity-40" : ""}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isToday(day) ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {day.getDate()}
                    </p>
                    {dayAppointments.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Appointment Creation Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={appointmentForm.clientId}
                onValueChange={(value) =>
                  setAppointmentForm({ ...appointmentForm, clientId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={appointmentForm.title}
                onChange={(e) =>
                  setAppointmentForm({ ...appointmentForm, title: e.target.value })
                }
                placeholder="e.g., Tattoo Session"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={appointmentForm.description}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    description: e.target.value,
                  })
                }
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={appointmentForm.startTime}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={appointmentForm.endTime}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      endTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateAppointment}
                disabled={createAppointmentMutation.isPending}
                className="flex-1"
              >
                {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAppointmentDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={showAppointmentDetailDialog} onOpenChange={setShowAppointmentDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Service</Label>
                <p className="text-lg font-semibold">{selectedAppointment.serviceName || selectedAppointment.title}</p>
              </div>

              {selectedAppointment.clientName && (
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{selectedAppointment.clientName}</p>
                  {selectedAppointment.clientEmail && (
                    <p className="text-sm text-muted-foreground">{selectedAppointment.clientEmail}</p>
                  )}
                </div>
              )}

              {selectedAppointment.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedAppointment.description}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {new Date(selectedAppointment.startTime).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAppointment.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(selectedAppointment.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {selectedAppointment.price && (
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="text-lg font-semibold text-primary">${selectedAppointment.price}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="capitalize">{selectedAppointment.status}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this appointment?')) {
                      deleteAppointmentMutation.mutate(selectedAppointment.id);
                    }
                  }}
                  disabled={deleteAppointmentMutation.isPending}
                  className="flex-1"
                >
                  {deleteAppointmentMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAppointmentDetailDialog(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="mobile-nav grid grid-cols-3">
        <button
          onClick={() => setLocation("/conversations")}
          className="flex flex-col items-center justify-center py-3 tap-target"
        >
          <MessageCircle className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Messages</span>
        </button>
        <button className="flex flex-col items-center justify-center py-3 tap-target">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <span className="text-xs text-primary font-semibold mt-1">
            Calendar
          </span>
        </button>
        <button
          onClick={() => setLocation("/settings")}
          className="flex flex-col items-center justify-center py-3 tap-target"
        >
          <Settings className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}

