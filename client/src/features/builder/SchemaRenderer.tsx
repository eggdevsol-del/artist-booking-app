import React from "react";
import { PageSchema, BlockNode, SectionNode } from "./types";
import { COMPONENT_REGISTRY } from "./registry";
import { Card } from "@/UI Library/Card";

export interface SchemaRendererProps {
    schema: PageSchema;
}

const RenderBlock = ({ block }: { block: BlockNode }) => {
    const entry = COMPONENT_REGISTRY[block.registryKey];

    if (!entry) {
        return (
            <Card className="p-4 bg-red-950/20 border-red-500/30 text-red-500 text-xs my-2">
                Unknown block: {block.registryKey}
            </Card>
        );
    }

    try {
        const rendered = entry.render(block.props);

        if (entry.supportsChildren && block.children?.length) {
            // If the component supports children, we need a way to pass them.
            // For now, we'll assume the rendered component is a wrapper that can take children
            // but the registry render function needs to handle it.
            // Re-evaluating: Registry render should probably take children too.
            return (
                <div className="relative group">
                    {React.cloneElement(
                        rendered as React.ReactElement,
                        {},
                        block.children.map(child => <RenderBlock key={child.id} block={child} />)
                    )}
                </div>
            );
        }

        return rendered;
    } catch (err) {
        return (
            <Card className="p-4 bg-red-950/20 border-red-500/30 text-red-500 text-xs my-2">
                error rendering {block.registryKey}
            </Card>
        );
    }
};

const RenderSection = ({ section }: { section: SectionNode }) => (
    <section className="mb-8 w-full">
        {section.blocks.map(block => (
            <RenderBlock key={block.id} block={block} />
        ))}
    </section>
);

export const SchemaRenderer = ({ schema }: SchemaRendererProps) => {
    return (
        <div className="w-full max-w-md mx-auto h-full overflow-y-auto no-scrollbar pb-32">
            {schema.sections.map(section => (
                <RenderSection key={section.id} section={section} />
            ))}
        </div>
    );
};
