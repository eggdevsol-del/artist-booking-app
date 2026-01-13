import { useAuth } from "@/_core/hooks/useAuth";

export default function Wallet() {
    const { user } = useAuth();
    const isArtist = user?.role === 'artist' || user?.role === 'admin';

    return (
        <div className="min-h-screen py-6 px-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">
                {isArtist ? "Vouchers & Promotions" : "My Wallet"}
            </h1>

            <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
                <h2 className="text-lg font-semibold mb-2">
                    {isArtist ? "Create Promotion" : "Balance"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {isArtist ? "Templates loading..." : "$0.00"}
                </p>
            </div>
        </div>
    );
}
