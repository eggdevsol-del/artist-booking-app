
import { Button } from "@/components/ui/button";
import { Plus, Coffee, Link as LinkIcon, FileText } from "lucide-react";

export function QuickActions() {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" className="flex-col h-auto py-3 px-1 gap-2 border-dashed border-primary/30 hover:border-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium">New Booking</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3 px-1 gap-2 border-dashed border-border hover:border-primary/50">
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Coffee className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-[10px] font-medium">Block Time</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3 px-1 gap-2 border-dashed border-border hover:border-primary/50">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-medium">Share Link</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3 px-1 gap-2 border-dashed border-border hover:border-primary/50">
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-[10px] font-medium">Policies</span>
                </Button>
            </div>
        </div>
    );
}
