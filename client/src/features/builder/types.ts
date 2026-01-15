export interface BlockNode {
    id: string;
    registryKey: string;
    props: Record<string, any>;
    children?: BlockNode[];
}

export interface SectionNode {
    id: string;
    type: "section";
    blocks: BlockNode[];
}

export interface PageSchema {
    id: string;
    name: string;
    meta: {
        title?: string;
    };
    sections: SectionNode[];
}

export type ComponentCategory = "layout" | "content" | "navigation" | "calendar" | "utility";

export interface RegistryEntry {
    key: string;
    displayName: string;
    category: ComponentCategory;
    defaultProps: Record<string, any>;
    propsSchema?: any; // For MVP, we can use a basic descriptor
    supportsChildren: boolean;
    render: (props: any) => React.ReactNode;
}
