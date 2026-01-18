import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";

export default function Wallet() {
    const { user } = useAuth();
    const isArtist = user?.role === 'artist' || user?.role === 'admin';

    return (
        <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden">

            {/* 1. Page Header */}
            <header className="px-4 py-4 z-10 shrink-0">
                <h1 className="text-2xl font-bold text-foreground">
                    {isArtist ? "Vouchers" : "Wallet"}
                </h1>
            </header>

            {/* 2. Top Context Area */}
            <div className="px-6 pt-4 pb-8 z-10 shrink-0 flex flex-col justify-center h-[20vh] opacity-80">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {isArtist ? "Active Promotions" : "Balance"}
                    </span>
                    <p className="text-5xl font-light text-foreground/90 tracking-tighter tabular-nums mt-1">
                        {isArtist ? "3 Active" : "$0.00"}
                    </p>
                </div>
            </div>

            {/* 3. Sheet Container */}
            <div className="flex-1 z-20 flex flex-col bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden relative">

                {/* Top Edge Highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Sheet Title */}
                <div className="shrink-0 pt-6 pb-2 px-6 border-b border-white/5">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {isArtist ? "Sales History" : "Recent Transactions"}
                    </h2>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 w-full h-full px-4 pt-4 overflow-y-auto mobile-scroll touch-pan-y">
                    <div className="space-y-3 pb-32 max-w-lg mx-auto">
                        {/* Placeholder Card */}
                        <Card className="p-4 rounded-2xl bg-white/5 border-white/5 shadow-none">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">Account Created</p>
                                    <p className="text-xs text-muted-foreground">Just now</p>
                                </div>
                                <span className="text-emerald-500 font-medium">+$0.00</span>
                            </div>
                        </Card>
                        <div className="p-12 text-center text-muted-foreground/40 text-sm">
                            No other transactions yet.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
