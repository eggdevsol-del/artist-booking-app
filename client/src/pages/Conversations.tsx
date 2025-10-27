import { useAuth } from "@/_core/hooks/useAuth";
import BottomNav from "@/components/BottomNav";

export default function Conversations() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Not authenticated</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex-1 p-4">
        <h1 className="text-white text-2xl mb-4">Conversations</h1>
        <p className="text-gray-400">Welcome, {user.fullName}!</p>
        <p className="text-gray-400">Role: {user.role}</p>
        <p className="text-gray-400">Email: {user.email}</p>
      </div>
      <BottomNav />
    </div>
  );
}

