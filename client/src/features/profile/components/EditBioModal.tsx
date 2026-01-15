import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditBioModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialBio: string;
    onSave: (bio: string) => Promise<void>;
}

export function EditBioModal({ isOpen, onClose, initialBio, onSave }: EditBioModalProps) {
    const [bio, setBio] = useState(initialBio);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setBio(initialBio || "");
    }, [initialBio, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(bio);
        setIsSaving(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Bio</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="min-h-[120px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
