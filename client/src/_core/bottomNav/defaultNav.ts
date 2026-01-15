import { Calendar, Image, LayoutDashboard, MessageCircle, Settings, Wallet, Compass, User } from "lucide-react";
import { BottomNavButton } from "./types";

export const ARTIST_NAV_ITEMS: BottomNavButton[] = [
    { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "messages", path: "/conversations", label: "Messages", icon: MessageCircle, badgeCount: 0 }, // Badge logic handles count dynamically
    { id: "calendar", path: "/calendar", label: "Calendar", icon: Calendar },
    { id: "portfolio", path: "/portfolio", label: "Portfolio", icon: Image },
    { id: "wallet", path: "/wallet", label: "Wallet", icon: Wallet },
    { id: "settings", path: "/settings", label: "Settings", icon: Settings },
];

export const CLIENT_NAV_ITEMS: BottomNavButton[] = [
    { id: "profile", path: "/profile", label: "Profile", icon: User },
    { id: "messages", path: "/conversations", label: "Messages", icon: MessageCircle },
    { id: "calendar", path: "/calendar", label: "Calendar", icon: Calendar },
    { id: "explore", path: "/explore", label: "Explore", icon: Compass },
    { id: "wallet", path: "/wallet", label: "Wallet", icon: Wallet },
    { id: "settings", path: "/settings", label: "Settings", icon: Settings },
];

// Default to artist for backward compatibility or initial load
export const MAIN_NAV_ITEMS = ARTIST_NAV_ITEMS;
