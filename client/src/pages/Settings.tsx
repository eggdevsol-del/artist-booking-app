import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import DemoDataLoader from "./DemoDataLoader";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import WorkHoursAndServices from "./WorkHoursAndServices";
import ArtistLink from "@/components/ArtistLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
  User,
  Zap,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type SettingsSection = "main" | "profile" | "work-hours" | "quick-actions" | "notifications" | "business";

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Business settings state
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [bsb, setBsb] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const upsertArtistSettingsMutation = trpc.artistSettings.upsert.useMutation({
    onSuccess: () => {
      toast.success("Business info updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update business info: " + error.message);
    },
  });

  const { data: artistSettings } = trpc.artistSettings.get.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  const { data: quickActions } = trpc.quickActions.list.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  const { data: notificationTemplates } = trpc.notificationTemplates.list.useQuery(undefined, {
    enabled: !!user && (user.role === "artist" || user.role === "admin"),
  });

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!loading && !user) {
  //     setLocation("/login");
  //   }
  // }, [user, loading, setLocation]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
      setProfileBio(user.bio || "");
      setProfileAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    if (artistSettings) {
      setBusinessName(artistSettings.businessName || "");
      setBusinessAddress(artistSettings.businessAddress || "");
      setBsb(artistSettings.bsb || "");
      setAccountNumber(artistSettings.accountNumber || "");
      setDepositAmount(artistSettings.depositAmount?.toString() || "");
    }
  }, [artistSettings]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: profileName,
      phone: profilePhone,
      bio: profileBio,
      avatar: profileAvatar,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setProfileAvatar(data.url);
      toast.success('Profile picture uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const isArtist = user?.role === "artist" || user?.role === "admin";

  // Main settings menu
  if (activeSection === "main") {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-20">
        <header className="mobile-header px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </header>

        <main className="flex-1 px-4 py-4 mobile-scroll space-y-4">
          {/* Profile Section */}
          <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setActiveSection("profile")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Profile</CardTitle>
                    <CardDescription className="text-sm">
                      Manage your personal information
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">Appearance</CardTitle>
                    <CardDescription className="text-sm">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Client-only settings */}
          {!isArtist && (
            <>
              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setLocation("/consultations")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Consultations</CardTitle>
                        <CardDescription className="text-sm">
                          Request and manage consultations
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setLocation("/policies")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Bell className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-base">View Policies</CardTitle>
                        <CardDescription className="text-sm">
                          Read artist policies and terms
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </>
          )}

          {/* Artist-only settings */}
          {isArtist && (
            <>
              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setLocation("/clients")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Clients</CardTitle>
                        <CardDescription className="text-sm">
                          View and manage your client list
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

              {isArtist && user && (
                <ArtistLink artistId={user.id} artistName={user.name || "Artist"} />
              )}

              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setActiveSection("business")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <MapPin className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Business Info</CardTitle>
                        <CardDescription className="text-sm">
                          Set your business name and address
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setActiveSection("work-hours")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Work Hours & Services</CardTitle>
                        <CardDescription className="text-sm">
                          Set your schedule and manage services
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setLocation("/quick-actions")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Quick Action Buttons</CardTitle>
                        <CardDescription className="text-sm">
                          Manage chat quick-action buttons (up to 6)
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setLocation("/notifications-management")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Bell className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Notifications</CardTitle>
                        <CardDescription className="text-sm">
                          Manage notification templates and settings
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>

            </>
          )}

          {/* Demo Data Loader (Artist only) */}
          {isArtist && <DemoDataLoader />}

          {/* Logout */}
          <Card className="cursor-pointer hover:bg-destructive/5 transition-colors" onClick={handleLogout}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <CardTitle className="text-base text-destructive">Log Out</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

  // Profile section
  if (activeSection === "profile") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="mobile-header px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("main")}>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 mobile-scroll space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG or PNG</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleSaveBusinessInfo = () => {
    if (artistSettings) {
      upsertArtistSettingsMutation.mutate({
        businessName,
        businessAddress,
        bsb,
        accountNumber,
        depositAmount: depositAmount ? parseInt(depositAmount) : undefined,
        workSchedule: artistSettings.workSchedule,
        services: artistSettings.services,
      });
    }
  };

  // Business Info section
  if (activeSection === "business" && isArtist) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="mobile-header px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("main")}>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Business Info</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-safe space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                This information will be shared with clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Your business address"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Clients will receive a map link to this address on appointment day
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-foreground">Deposit Payment Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="bsb">BSB</Label>
                  <Input
                    id="bsb"
                    value={bsb}
                    onChange={(e) => setBsb(e.target.value)}
                    placeholder="123-456"
                    maxLength={7}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (per appointment)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    This amount will be multiplied by the number of appointments booked
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSaveBusinessInfo}
                disabled={upsertArtistSettingsMutation.isPending}
              >
                {upsertArtistSettingsMutation.isPending ? "Saving..." : "Save Business Info"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Work Hours & Services section
  if (activeSection === "work-hours" && isArtist) {
    return <WorkHoursAndServices onBack={() => setActiveSection("main")} />;
  }

  // Placeholder for other sections
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="mobile-header px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveSection("main")}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {activeSection === "quick-actions" && "Quick Actions"}
            {activeSection === "notifications" && "Notifications"}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <PushNotificationSettings />
      </main>
    </div>
  );
}

