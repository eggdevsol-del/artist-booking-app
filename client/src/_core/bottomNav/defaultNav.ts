import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet } from "lucide-react";
import { BottomNavButton } from "./types";

export const MAIN_NAV_ITEMS: BottomNavButton[] = [
    { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "messages", path: "/conversations", label: "Messages", icon: MessageCircle, badgeCount: 0 }, // Badge logic handles count dynamically
    { id: "calendar", path: "/calendar", label: "Calendar", icon: Calendar },
    { id: "portfolio", path: "/portfolio", label: "Portfolio", icon: Image },
    { id: "wallet", path: "/wallet", label: "Wallet", icon: Wallet },
    { id: "settings", path: "/settings", label: "Settings", icon: Settings },
];
