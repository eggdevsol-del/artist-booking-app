import { useAuth } from "@/_core/hooks/useAuth";
import { ArtistDashboard } from '../modules/dashboard/ArtistDashboard';
import { ClientDashboard } from '../modules/dashboard/ClientDashboard';

export default function Dashboard() {
    const { user } = useAuth();

    // In a real app we might handle "loading" or "unauthenticated" states here too 
    // but useAuth/ProtectedRoute usually handles the auth part.

    if (user?.role === 'artist' || user?.role === 'admin') {
        return <ArtistDashboard />;
    }

    return <ClientDashboard />;
}

