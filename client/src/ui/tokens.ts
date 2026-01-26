
export const tokens = {
    // 1. Backgrounds
    // Exact match from Calendar/Dashboard
    bgGradient: "fixed inset-0 w-full h-[100dvh] bg-[radial-gradient(circle_at_top_right,rgba(88,28,135,0.4),rgba(2,6,23,1)_60%)]",

    // 2. Sheets
    // Main sheet (Dashboard, Calendar) - extends past bottom
    sheetMain: {
        container: "flex-1 z-20 flex flex-col bg-[#0f1323]/80 backdrop-blur-[32px] rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative",
        highlight: "absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none",
        content: "flex-1 relative w-full overflow-hidden"
    },

    // Secondary sheet (Modals, Booking Wizard)
    sheetSecondary: {
        overlay: "fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm",
        content: "fixed inset-0 z-[101] w-full h-[100dvh] outline-none flex flex-col gap-0 overflow-hidden",
        container: "flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative"
    },

    // 3. Cards
    // Dashboard v1.0.101 style
    card: {
        base: "bg-white/5 border-0 rounded-2xl overflow-hidden transition-all duration-300",
        interactive: "cursor-pointer hover:bg-white/10 active:scale-[0.98]",
        glow: {
            high: { line: "bg-red-600", gradient: "from-red-600/20" },
            medium: { line: "bg-orange-500", gradient: "from-orange-500/20" },
            low: { line: "bg-emerald-500", gradient: "from-emerald-500/20" }
        }
    },

    // 4. Buttons
    button: {
        primary: "shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold",
        secondary: "bg-white/5 hover:bg-white/10 text-foreground h-12 text-base font-semibold",
        ghost: "text-white/50 hover:text-white hover:bg-white/5",
        icon: "rounded-full bg-white/5 hover:bg-white/10 text-foreground w-10 h-10 flex items-center justify-center transition-colors"
    },

    // 5. Typography
    header: {
        pageTitle: "text-xl font-bold text-white tracking-wide",
        sectionTitle: "text-xs font-bold text-muted-foreground tracking-widest uppercase",
        sheetTitle: "text-2xl font-bold text-foreground"
    },

    // 6. Layout
    spacing: {
        pagePadding: "px-6 py-4",
        sheetPadding: "px-6 pt-6 pb-2"
    }
} as const;
