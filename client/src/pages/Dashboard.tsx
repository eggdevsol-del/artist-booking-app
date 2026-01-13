import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen py-6 px-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            {/* Placeholder content */}
            <div className="mt-8 p-6 rounded-3xl bg-card border border-border">
                <h2 className="text-lg font-semibold mb-2">My Activity</h2>
                <p className="text-sm text-muted-foreground">Stats coming soon.</p>
            </div>
        </div>
    );
}
