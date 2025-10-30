import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Mail, MessageSquare, Phone, Save } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Use tRPC queries
  const { data: settings, refetch } = trpc.notificationSettings.get.useQuery();
  const updateSettingsMutation = trpc.notificationSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Follow-up Notification State
  const [followupEnabled, setFollowupEnabled] = useState(false);
  const [followupSms, setFollowupSms] = useState(false);
  const [followupEmail, setFollowupEmail] = useState(false);
  const [followupPush, setFollowupPush] = useState(false);
  const [followupText, setFollowupText] = useState("");
  const [followupTriggerType, setFollowupTriggerType] = useState("days");
  const [followupTriggerValue, setFollowupTriggerValue] = useState(1);

  // Aftercare Notification State
  const [aftercareEnabled, setAftercareEnabled] = useState(false);
  const [aftercareSms, setAftercareSms] = useState(false);
  const [aftercareEmail, setAftercareEmail] = useState(false);
  const [aftercarePush, setAftercarePush] = useState(false);
  const [aftercareDailyMessage, setAftercareDailyMessage] = useState("");
  const [aftercarePostMessage, setAftercarePostMessage] = useState("");
  const [aftercareFrequency, setAftercareFrequency] = useState("daily");
  const [aftercareDurationDays, setAftercareDurationDays] = useState(14);
  const [aftercareTime, setAftercareTime] = useState("09:00");

  // Review Notification State
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [reviewSms, setReviewSms] = useState(false);
  const [reviewEmail, setReviewEmail] = useState(false);
  const [reviewPush, setReviewPush] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewGoogleLink, setReviewGoogleLink] = useState("");
  const [reviewFacebookLink, setReviewFacebookLink] = useState("");
  const [reviewCustomLink, setReviewCustomLink] = useState("");
  const [reviewTriggerType, setReviewTriggerType] = useState("days");
  const [reviewTriggerValue, setReviewTriggerValue] = useState(7);

  // Pre-booking Notification State
  const [prebookingEnabled, setPrebookingEnabled] = useState(false);
  const [prebookingSms, setPrebookingSms] = useState(false);
  const [prebookingEmail, setPrebookingEmail] = useState(false);
  const [prebookingPush, setPrebookingPush] = useState(false);
  const [prebookingText, setPrebookingText] = useState("");
  const [prebookingIncludeDetails, setPrebookingIncludeDetails] = useState(true);
  const [prebookingIncludeTime, setPrebookingIncludeTime] = useState(true);
  const [prebookingIncludeMaps, setPrebookingIncludeMaps] = useState(true);
  const [prebookingTriggerType, setPrebookingTriggerType] = useState("hours");
  const [prebookingTriggerValue, setPrebookingTriggerValue] = useState(24);

  // Business Location State
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  useEffect(() => {
    if (settings) {
      loadSettings(settings);
    }
  }, [settings]);

  const loadSettings = (data: any) => {
    // Follow-up
    setFollowupEnabled(data.followupEnabled || false);
    setFollowupSms(data.followupSms || false);
    setFollowupEmail(data.followupEmail || false);
    setFollowupPush(data.followupPush || false);
    setFollowupText(data.followupText || "");
    setFollowupTriggerType(data.followupTriggerType || "days");
    setFollowupTriggerValue(data.followupTriggerValue || 1);

    // Aftercare
    setAftercareEnabled(data.aftercareEnabled || false);
    setAftercareSms(data.aftercareSms || false);
    setAftercareEmail(data.aftercareEmail || false);
    setAftercarePush(data.aftercarePush || false);
    setAftercareDailyMessage(data.aftercareDailyMessage || "");
    setAftercarePostMessage(data.aftercarePostMessage || "");
    setAftercareFrequency(data.aftercareFrequency || "daily");
    setAftercareDurationDays(data.aftercareDurationDays || 14);
    setAftercareTime(data.aftercareTime?.substring(0, 5) || "09:00");

    // Review
    setReviewEnabled(data.reviewEnabled || false);
    setReviewSms(data.reviewSms || false);
    setReviewEmail(data.reviewEmail || false);
    setReviewPush(data.reviewPush || false);
    setReviewText(data.reviewText || "");
    setReviewGoogleLink(data.reviewGoogleLink || "");
    setReviewFacebookLink(data.reviewFacebookLink || "");
    setReviewCustomLink(data.reviewCustomLink || "");
    setReviewTriggerType(data.reviewTriggerType || "days");
    setReviewTriggerValue(data.reviewTriggerValue || 7);

    // Pre-booking
    setPrebookingEnabled(data.prebookingEnabled || false);
    setPrebookingSms(data.prebookingSms || false);
    setPrebookingEmail(data.prebookingEmail || false);
    setPrebookingPush(data.prebookingPush || false);
    setPrebookingText(data.prebookingText || "");
    setPrebookingIncludeDetails(data.prebookingIncludeDetails !== false);
    setPrebookingIncludeTime(data.prebookingIncludeTime !== false);
    setPrebookingIncludeMaps(data.prebookingIncludeMaps !== false);
    setPrebookingTriggerType(data.prebookingTriggerType || "hours");
    setPrebookingTriggerValue(data.prebookingTriggerValue || 24);

    // Business Location
    setBusinessLocation(data.businessLocation || "");
    setBusinessAddress(data.businessAddress || "");
    
    setLoading(false);
  };

  const handleSave = () => {
    setSaving(true);
    updateSettingsMutation.mutate({
      followupEnabled,
      followupSms,
      followupEmail,
      followupPush,
      followupText,
      followupTriggerType,
      followupTriggerValue,
      
      aftercareEnabled,
      aftercareSms,
      aftercareEmail,
      aftercarePush,
      aftercareDailyMessage,
      aftercarePostMessage,
      aftercareFrequency,
      aftercareDurationDays,
      aftercareTime: aftercareTime + ":00",
      
      reviewEnabled,
      reviewSms,
      reviewEmail,
      reviewPush,
      reviewText,
      reviewGoogleLink,
      reviewFacebookLink,
      reviewCustomLink,
      reviewTriggerType,
      reviewTriggerValue,
      
      prebookingEnabled,
      prebookingSms,
      prebookingEmail,
      prebookingPush,
      prebookingText,
      prebookingIncludeDetails,
      prebookingIncludeTime,
      prebookingIncludeMaps,
      prebookingTriggerType,
      prebookingTriggerValue,
      
      businessLocation,
      businessAddress,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Notification Settings</h1>
              <p className="text-sm text-muted-foreground">Automate client communication</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Follow-up Notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Follow-up Notification
                </CardTitle>
                <CardDescription>
                  Send follow-up messages after appointments
                </CardDescription>
              </div>
              <Switch
                checked={followupEnabled}
                onCheckedChange={setFollowupEnabled}
              />
            </div>
          </CardHeader>
          {followupEnabled && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Delivery Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={followupSms} onCheckedChange={setFollowupSms} />
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={followupEmail} onCheckedChange={setFollowupEmail} />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={followupPush} onCheckedChange={setFollowupPush} />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="followupText">Custom Message</Label>
                <Textarea
                  id="followupText"
                  placeholder="Hi {client_name}, thank you for your appointment! How are you feeling?"
                  value={followupText}
                  onChange={(e) => setFollowupText(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {"{client_name}"} for personalization
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followupTriggerValue">Send After</Label>
                  <Input
                    id="followupTriggerValue"
                    type="number"
                    min="1"
                    value={followupTriggerValue}
                    onChange={(e) => setFollowupTriggerValue(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="followupTriggerType">Time Unit</Label>
                  <Select value={followupTriggerType} onValueChange={setFollowupTriggerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after_sitting">Immediately after</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Aftercare Notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Aftercare Notification
                </CardTitle>
                <CardDescription>
                  Send daily aftercare instructions post-appointment
                </CardDescription>
              </div>
              <Switch
                checked={aftercareEnabled}
                onCheckedChange={setAftercareEnabled}
              />
            </div>
          </CardHeader>
          {aftercareEnabled && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Delivery Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={aftercareSms} onCheckedChange={setAftercareSms} />
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={aftercareEmail} onCheckedChange={setAftercareEmail} />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={aftercarePush} onCheckedChange={setAftercarePush} />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="aftercareDailyMessage">Daily Aftercare Message</Label>
                <Textarea
                  id="aftercareDailyMessage"
                  placeholder="Remember to clean your tattoo twice daily with antibacterial soap..."
                  value={aftercareDailyMessage}
                  onChange={(e) => setAftercareDailyMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="aftercarePostMessage">Post-Aftercare Message</Label>
                <Textarea
                  id="aftercarePostMessage"
                  placeholder="Your aftercare period is complete! Your tattoo should be fully healed..."
                  value={aftercarePostMessage}
                  onChange={(e) => setAftercarePostMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aftercareFrequency">Frequency</Label>
                  <Select value={aftercareFrequency} onValueChange={setAftercareFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="every_other_day">Every Other Day</SelectItem>
                      <SelectItem value="twice_weekly">Twice Weekly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="aftercareDurationDays">Duration (days)</Label>
                  <Input
                    id="aftercareDurationDays"
                    type="number"
                    min="1"
                    value={aftercareDurationDays}
                    onChange={(e) => setAftercareDurationDays(parseInt(e.target.value) || 14)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="aftercareTime">Send Time</Label>
                <Input
                  id="aftercareTime"
                  type="time"
                  value={aftercareTime}
                  onChange={(e) => setAftercareTime(e.target.value)}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Review Notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Review Request Notification
                </CardTitle>
                <CardDescription>
                  Ask clients for reviews after appointments
                </CardDescription>
              </div>
              <Switch
                checked={reviewEnabled}
                onCheckedChange={setReviewEnabled}
              />
            </div>
          </CardHeader>
          {reviewEnabled && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Delivery Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={reviewSms} onCheckedChange={setReviewSms} />
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={reviewEmail} onCheckedChange={setReviewEmail} />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={reviewPush} onCheckedChange={setReviewPush} />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="reviewText">Custom Message</Label>
                <Textarea
                  id="reviewText"
                  placeholder="Hi {client_name}, we'd love to hear about your experience! Please leave us a review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="reviewGoogleLink">Google Review Link</Label>
                <Input
                  id="reviewGoogleLink"
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={reviewGoogleLink}
                  onChange={(e) => setReviewGoogleLink(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reviewFacebookLink">Facebook Review Link</Label>
                <Input
                  id="reviewFacebookLink"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={reviewFacebookLink}
                  onChange={(e) => setReviewFacebookLink(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reviewCustomLink">Custom Review Link</Label>
                <Input
                  id="reviewCustomLink"
                  type="url"
                  placeholder="https://..."
                  value={reviewCustomLink}
                  onChange={(e) => setReviewCustomLink(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewTriggerValue">Send After</Label>
                  <Input
                    id="reviewTriggerValue"
                    type="number"
                    min="1"
                    value={reviewTriggerValue}
                    onChange={(e) => setReviewTriggerValue(parseInt(e.target.value) || 7)}
                  />
                </div>
                <div>
                  <Label htmlFor="reviewTriggerType">Time Unit</Label>
                  <Select value={reviewTriggerType} onValueChange={setReviewTriggerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after_sitting">Immediately after</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Pre-booking Notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Pre-booking Reminder
                </CardTitle>
                <CardDescription>
                  Send reminders before appointments
                </CardDescription>
              </div>
              <Switch
                checked={prebookingEnabled}
                onCheckedChange={setPrebookingEnabled}
              />
            </div>
          </CardHeader>
          {prebookingEnabled && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Delivery Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingSms} onCheckedChange={setPrebookingSms} />
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingEmail} onCheckedChange={setPrebookingEmail} />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingPush} onCheckedChange={setPrebookingPush} />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="prebookingText">Custom Message</Label>
                <Textarea
                  id="prebookingText"
                  placeholder="Hi {client_name}, this is a reminder about your upcoming appointment..."
                  value={prebookingText}
                  onChange={(e) => setPrebookingText(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Include in Reminder</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingIncludeDetails} onCheckedChange={setPrebookingIncludeDetails} />
                    <span className="text-sm">Appointment Details</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingIncludeTime} onCheckedChange={setPrebookingIncludeTime} />
                    <span className="text-sm">Date & Time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={prebookingIncludeMaps} onCheckedChange={setPrebookingIncludeMaps} />
                    <span className="text-sm">Maps Link</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prebookingTriggerValue">Send Before</Label>
                  <Input
                    id="prebookingTriggerValue"
                    type="number"
                    min="1"
                    value={prebookingTriggerValue}
                    onChange={(e) => setPrebookingTriggerValue(parseInt(e.target.value) || 24)}
                  />
                </div>
                <div>
                  <Label htmlFor="prebookingTriggerType">Time Unit</Label>
                  <Select value={prebookingTriggerType} onValueChange={setPrebookingTriggerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Business Location */}
        <Card>
          <CardHeader>
            <CardTitle>Business Location</CardTitle>
            <CardDescription>
              Used for maps links in pre-booking reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessLocation">Location Name</Label>
              <Input
                id="businessLocation"
                placeholder="My Studio"
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Full Address</Label>
              <Textarea
                id="businessAddress"
                placeholder="123 Main St, City, State 12345"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}

