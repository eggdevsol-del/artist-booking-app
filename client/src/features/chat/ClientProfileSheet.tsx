import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Phone, Cake, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ClientProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        birthday?: string | null;
        avatar?: string | null;
    } | null | undefined;
}

export function ClientProfileSheet({ isOpen, onClose, client }: ClientProfileSheetProps) {
    if (!client) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                <SheetHeader className="pb-6 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold uppercase tracking-widest text-primary/80">
                            Client Profile
                        </SheetTitle>
                        <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] tracking-widest bg-primary/5">
                            UI v2
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden ring-4 ring-background/50 shadow-xl">
                            {client.avatar ? (
                                <img src={client.avatar} alt={client.name || "Client"} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl text-white font-bold">
                                    {(client.name || "?").charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {client.name || "Unknown Client"}
                                <BadgeCheck className="w-5 h-5 text-blue-400" />
                            </h2>
                            <p className="text-sm text-muted-foreground">Client since {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="info" className="flex-1 mt-6">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-1 rounded-xl">
                        <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">Info</TabsTrigger>
                        <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">Media</TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">History</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[calc(100vh-250px)] mt-6 -mr-6 pr-6">
                        <TabsContent value="info" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid gap-4">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                        <Mail className="w-3 h-3" /> Contact Email
                                    </div>
                                    <p className="font-medium text-foreground text-sm">{client.email || "No email provided"}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                        <Phone className="w-3 h-3" /> Phone Number
                                    </div>
                                    <p className="font-medium text-foreground text-sm">{client.phone || "No phone number"}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                        <Cake className="w-3 h-3" /> Birthday
                                    </div>
                                    <p className="font-medium text-foreground text-sm">
                                        {client.birthday
                                            ? format(new Date(client.birthday), 'MMMM do, yyyy')
                                            : "Not set"}
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="media">
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium">No shared media</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium">No booking history</p>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
