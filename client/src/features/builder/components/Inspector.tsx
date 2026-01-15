import { BlockNode } from "../types";
import { COMPONENT_REGISTRY } from "../registry";
import { Input } from "@/UI Library/Input";
import { Label } from "@/UI Library/Label";
import { Switch } from "@/UI Library/Switch";
import { cn } from "@/lib/utils";

interface InspectorProps {
    selectedBlock: BlockNode | null;
    onChange: (id: string, props: Record<string, any>) => void;
    isMobile?: boolean;
}

export function Inspector({ selectedBlock, onChange, isMobile }: InspectorProps) {
    if (!selectedBlock) {
        return (
            <div className={cn(
                "border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 items-center justify-center p-8 text-center",
                isMobile ? "w-full h-full border-0" : "w-72 border-l h-full"
            )}>
                <p className="text-sm text-white/30 italic">Select a block to inspect its properties</p>
            </div>
        );
    }

    const entry = COMPONENT_REGISTRY[selectedBlock.registryKey];
    const props = selectedBlock.props;

    const handlePropChange = (key: string, value: any) => {
        onChange(selectedBlock.id, { ...props, [key]: value });
    };

    return (
        <div className={cn(
            "border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto no-scrollbar",
            isMobile ? "w-full h-full border-0" : "w-72 border-l h-full"
        )}>
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inspector</h3>
                <p className="text-[10px] text-primary font-bold mt-1 tracking-tighter uppercase">{entry.displayName}</p>
            </div>

            <div className="p-4 space-y-4">
                {Object.keys(entry.defaultProps).map(key => {
                    const value = props[key] ?? entry.defaultProps[key];
                    const type = typeof value;

                    return (
                        <div key={key} className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wide text-white/50">{key}</Label>

                            {type === "boolean" ? (
                                <div className="flex items-center space-x-2 py-1">
                                    <Switch
                                        checked={value}
                                        onCheckedChange={(val) => handlePropChange(key, val)}
                                    />
                                    <span className="text-xs text-white/70">{value ? "Enabled" : "Disabled"}</span>
                                </div>
                            ) : Array.isArray(value) ? (
                                <Input
                                    value={value.join(", ")}
                                    onChange={(e) => handlePropChange(key, e.target.value.split(",").map(s => s.trim()))}
                                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                                />
                            ) : (
                                <Input
                                    value={value}
                                    onChange={(e) => handlePropChange(key, e.target.value)}
                                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
