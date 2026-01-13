
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Conversations() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Conversations (Debug Mode)</h1>
      <p>If you see this, the render loop is gone.</p>
      <Button onClick={() => setLocation("/")}>Go Home</Button>
    </div>
  );
}
