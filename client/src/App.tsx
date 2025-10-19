import { Toaster } from "@/components/ui/sonner";
import InstallPrompt from "./components/InstallPrompt";
import IOSInstallPrompt from "./components/IOSInstallPrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Conversations from "./pages/Conversations";
import RoleSelection from "./pages/RoleSelection";
import Consultations from "./pages/Consultations";
import Policies from "./pages/Policies";
import PolicyManagement from "./pages/PolicyManagement";
import NotificationsManagement from "./pages/NotificationsManagement";
import WorkHours from "./pages/WorkHours";
import QuickActionsManagement from "./pages/QuickActionsManagement";
import CompleteProfile from "./pages/CompleteProfile";
import Clients from "./pages/Clients";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/settings" component={Settings} />
      <Route path="/consultations" component={Consultations} />
      <Route path="/policies" component={Policies} />
       <Route path="/policy-management" component={PolicyManagement} />
      <Route path="/notifications-management" component={NotificationsManagement} />
      <Route path="/work-hours" component={WorkHours} />
      <Route path="/quick-actions" component={QuickActionsManagement} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/clients" component={Clients} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <IOSInstallPrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
  );
}

export default App;

