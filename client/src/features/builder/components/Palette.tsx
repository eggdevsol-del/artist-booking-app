import { COMPONENT_REGISTRY } from "../registry";
import { ComponentCategory } from "../types";
import { Card } from "@/UI Library/Card";
import { cn } from "@/lib/utils";

interface PaletteProps {
    onAddComponent: (key: string) => void;
}

export function Palette({ onAddComponent }: PaletteProps) {
    const categories: ComponentCategory[] = ["layout", "content", "navigation", "calendar", "utility"];

    return (
        <div className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Palette</h3>
            </div>

            <div className="p-4 space-y-6">
                {categories.map(cat => {
                    const components = Object.values(COMPONENT_REGISTRY).filter(c => c.category === cat);
                    if (components.length === 0) return null;

                    return (
                        <div key={cat} className="space-y-2">
                            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{cat}</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {components.map(comp => (
                                    <button
                                        key={comp.key}
                                        onClick={() => onAddComponent(comp.key)}
                                        className="text-left p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                                    >
                                        <p className="text-xs font-semibold text-white/80 group-hover:text-white">{comp.displayName}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
