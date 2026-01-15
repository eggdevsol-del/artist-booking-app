import { useState, useEffect, useCallback } from "react";
import { BUILDER_CONFIG } from "@/config/builderConfig";
import { Button } from "@/UI Library/Button";
import { Card } from "@/UI Library/Card";
import { Palette } from "../features/builder/components/Palette";
import { Inspector } from "../features/builder/components/Inspector";
import { COMPONENT_REGISTRY } from "../features/builder/registry";
import { PageSchema, BlockNode } from "../features/builder/types";
import { Persistence } from "../features/builder/persistence";
import { nanoid } from "nanoid";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableBlock } from "../features/builder/components/DraggableBlock";

export default function BuilderPage() {
    const [schemas, setSchemas] = useState<PageSchema[]>([]);
    const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Set Title
    useEffect(() => {
        document.title = "Builder";
    }, []);

    // Load initial data
    useEffect(() => {
        const loaded = Persistence.loadSchemas();
        setSchemas(loaded);
        const last = Persistence.loadLastOpened();
        if (last && loaded.find(s => s.id === last)) {
            setActiveSchemaId(last);
        } else if (loaded.length > 0) {
            setActiveSchemaId(loaded[0].id);
        }
    }, []);

    const schema = schemas.find(s => s.id === activeSchemaId);

    // Save changes
    const save = useCallback((updatedSchemas: PageSchema[]) => {
        setSchemas(updatedSchemas);
        Persistence.saveSchemas(updatedSchemas);
    }, []);

    const handleSchemaChange = (updated: PageSchema) => {
        const newSchemas = schemas.map(s => s.id === updated.id ? updated : s);
        save(newSchemas);
    };

    const handleAddComponent = (registryKey: string) => {
        if (!schema) return;
        const entry = COMPONENT_REGISTRY[registryKey];
        const newBlock: BlockNode = {
            id: nanoid(),
            registryKey,
            props: { ...entry.defaultProps }
        };

        const updated = {
            ...schema,
            sections: schema.sections.map((sec, i) =>
                i === 0 ? { ...sec, blocks: [...sec.blocks, newBlock] } : sec
            )
        };
        handleSchemaChange(updated);
        setSelectedBlockId(newBlock.id);
    };

    const handleUpdateBlock = (blockId: string, props: Record<string, any>) => {
        if (!schema) return;
        const updated = {
            ...schema,
            sections: schema.sections.map(sec => ({
                ...sec,
                blocks: sec.blocks.map(b => b.id === blockId ? { ...b, props } : b)
            }))
        };
        handleSchemaChange(updated);
    };

    const handleDeleteBlock = (blockId: string) => {
        if (!schema) return;
        const updated = {
            ...schema,
            sections: schema.sections.map(sec => ({
                ...sec,
                blocks: sec.blocks.filter(b => b.id !== blockId)
            }))
        };
        handleSchemaChange(updated);
        if (selectedBlockId === blockId) setSelectedBlockId(null);
    };

    // DND Handlers
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id && schema) {
            const section = schema.sections[0]; // Assuming 1 section for MVP
            const oldIndex = section.blocks.findIndex(b => b.id === active.id);
            const newIndex = section.blocks.findIndex(b => b.id === over.id);

            const updatedBlocks = arrayMove(section.blocks, oldIndex, newIndex);
            const updated = {
                ...schema,
                sections: schema.sections.map((sec, i) =>
                    i === 0 ? { ...sec, blocks: updatedBlocks } : sec
                )
            };
            handleSchemaChange(updated);
        }
    };

    if (!BUILDER_CONFIG.BUILDER_ENABLED) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
                <Card className="p-8 max-w-md text-center border-white/10 bg-black/40 backdrop-blur-xl">
                    <h1 className="text-2xl font-bold mb-4">Builder Disabled</h1>
                    <p className="text-muted-foreground mb-6">
                        The page builder is currently disabled in the configuration.
                    </p>
                    <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
                </Card>
            </div>
        );
    }

    const selectedBlock = schema?.sections.flatMap(s => s.blocks).find(b => b.id === selectedBlockId) || null;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            {/* Nav Header */}
            <header className="h-14 border-b border-white/10 flex items-center px-6 shrink-0 bg-black/40 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black text-sm">B</div>
                    <span className="font-bold tracking-tight">Builder <span className="text-white/20">/</span> {schema?.name}</span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] uppercase font-bold text-white/50 hover:text-white"
                        onClick={() => {
                            if (schema) Persistence.exportSchema(schema);
                        }}
                    >
                        Export
                    </Button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Dev Tooling</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <Palette onAddComponent={handleAddComponent} />

                {/* Canvas Area */}
                <main className="flex-1 bg-[#0a0a0a] flex flex-col items-center overflow-y-auto no-scrollbar py-12 px-4 relative">
                    <div className="w-full max-w-md bg-background min-h-[812px] shadow-2xl rounded-[40px] border-[8px] border-white/5 overflow-hidden flex flex-col relative">
                        {/* Mock Phone Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50" />

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-10">
                            {schema && (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="space-y-4">
                                        {schema.sections.map(section => (
                                            <SortableContext
                                                key={section.id}
                                                items={section.blocks.map(b => b.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {section.blocks.map(block => (
                                                    <DraggableBlock
                                                        key={block.id}
                                                        id={block.id}
                                                        isSelected={selectedBlockId === block.id}
                                                        onClick={() => setSelectedBlockId(block.id)}
                                                        onDelete={() => handleDeleteBlock(block.id)}
                                                    >
                                                        {COMPONENT_REGISTRY[block.registryKey]?.render(block.props)}
                                                    </DraggableBlock>
                                                ))}
                                            </SortableContext>
                                        ))}

                                        {schema.sections[0].blocks.length === 0 && (
                                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                                                <p className="text-white/20 text-xs italic">Empty Page. Click components to add.</p>
                                            </div>
                                        )}
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    </div>

                    {/* Temporary Landing Link */}
                    <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 text-center max-w-sm">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Status</p>
                        <p className="text-xs text-white/80">Builder is currently the <span className="text-primary font-bold">Default Landing Page</span>.</p>
                        <button
                            className="mt-2 text-[10px] text-primary hover:underline font-bold"
                            onClick={() => window.location.href = '/dashboard'}
                        >
                            Open Dashboard →
                        </button>
                    </div>
                </main>

                <Inspector
                    selectedBlock={selectedBlock}
                    onChange={handleUpdateBlock}
                />
            </div>
        </div>
    );
}
