import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableBlockProps {
    id: string;
    children: React.ReactNode;
    onDelete: () => void;
    isSelected: boolean;
    onClick: () => void;
}

export function DraggableBlock({ id, children, onDelete, isSelected, onClick }: DraggableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group border border-transparent rounded-lg transition-all mb-2",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-white/10"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-white/30 hover:text-white"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Block Content */}
            <div className="pointer-events-none">
                {children}
            </div>

            {/* Delete/Action overlay (only when selected) */}
            {isSelected && (
                <div className="absolute -right-2 -top-2 flex gap-1 z-40">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
