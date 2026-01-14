import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface BottomNavContextType {
    // The content of the contextual row (Row 1)
    contextualRow: ReactNode | null;
    // Whether the contextual row is currently visible (rowIndex === 1)
    isContextualVisible: boolean;
    // Function to register a row (returns unregister function)
    registerRow: (id: string, content: ReactNode) => () => void;
    // Function to toggle visibility
    setContextualVisible: (visible: boolean) => void;
    // Current row index (0 = default, 1 = contextual)
    rowIndex: number;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export function BottomNavProvider({ children }: { children: React.ReactNode }) {
    const [registry, setRegistry] = useState<Record<string, ReactNode>>({});
    const [isContextualVisible, setIsContextualVisible] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Derived contextual row based on the most recently registered ID (or just the active one)
    // Simple strategy: If multiple registered, last one wins? 
    // Better: We assume standard route transitions mean only one is "active" mostly.
    // We'll use the last key in the registry as the active one for simplicity in this single-layer nav.
    const contextualRow = activeId ? registry[activeId] : null;

    const registerRow = useCallback((id: string, content: ReactNode) => {
        setRegistry((prev) => ({ ...prev, [id]: content }));
        setActiveId(id);
        return () => {
            setRegistry((prev) => {
                const newRegistry = { ...prev };
                delete newRegistry[id];
                return newRegistry;
            });
            setActiveId((current) => (current === id ? null : current));
            // Reset to main row if the active contextual row is removed
            if (activeId === id) {
                setIsContextualVisible(false);
            }
        };
    }, [activeId]);

    const setContextualVisible = useCallback((visible: boolean) => {
        if (visible && !contextualRow) return; // Cannot show if no content
        setIsContextualVisible(visible);
    }, [contextualRow]);

    const rowIndex = isContextualVisible && contextualRow ? 1 : 0;

    return (
        <BottomNavContext.Provider
            value={{
                contextualRow,
                isContextualVisible,
                registerRow,
                setContextualVisible,
                rowIndex,
            }}
        >
            {children}
        </BottomNavContext.Provider>
    );
}

export function useBottomNav() {
    const context = useContext(BottomNavContext);
    if (context === undefined) {
        throw new Error("useBottomNav must be used within a BottomNavProvider");
    }
    return context;
}

export function useRegisterBottomNavRow(id: string, content: ReactNode) {
    const { registerRow } = useBottomNav();

    useEffect(() => {
        const unregister = registerRow(id, content);
        return unregister;
    }, [id, content, registerRow]);
}
