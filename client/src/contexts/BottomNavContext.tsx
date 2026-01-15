import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ARTIST_NAV_ITEMS, CLIENT_NAV_ITEMS } from "@/_core/bottomNav/defaultNav";
import { BottomNavButton } from "@/_core/bottomNav/types";

export type Scope = 'artist' | 'client';

interface BottomNavContextType {
    // The content of the contextual row (Row 1)
    contextualRow: ReactNode | null;
    // Main row items based on scope
    navItems: BottomNavButton[];
    // Whether the contextual row is currently visible (rowIndex === 1)
    isContextualVisible: boolean;
    // Function to register a row (returns unregister function)
    registerRow: (scope: Scope, id: string, content: ReactNode) => () => void;
    // Function to toggle visibility
    setContextualVisible: (visible: boolean) => void;
    // Current row index (0 = default, 1 = contextual)
    rowIndex: number;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export function BottomNavProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    // Default to 'client' for safety if not authenticated or specified, but 'artist' is the legacy default.
    // User requested "derived from authenticated user role". 
    // We treat 'admin' or others as 'artist' for now if they exist, or strictly 'artist'.
    const rawRole = user?.role;
    const scope: Scope = rawRole === 'artist' ? 'artist' : 'client';

    const [registry, setRegistry] = useState<Record<Scope, Record<string, ReactNode>>>({
        artist: {},
        client: {}
    });

    // We keep activeId 'global' but it only resolves if present in current scope.
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isContextualVisible, setIsContextualVisible] = useState(false);

    // Derived contextual row based on current scope
    const contextualRow = activeId ? (registry[scope][activeId] || null) : null;

    // Derived nav items
    const navItems = scope === 'artist' ? ARTIST_NAV_ITEMS : CLIENT_NAV_ITEMS;

    const registerRow = useCallback((targetScope: Scope, id: string, content: ReactNode) => {
        setRegistry((prev) => ({
            ...prev,
            [targetScope]: {
                ...prev[targetScope],
                [id]: content
            }
        }));
        setActiveId(id);

        return () => {
            setRegistry((prev) => {
                const newScopeRegistry = { ...prev[targetScope] };
                delete newScopeRegistry[id];
                return {
                    ...prev,
                    [targetScope]: newScopeRegistry
                };
            });

            // Atomically check if we are removing the active row
            setActiveId((current) => {
                if (current === id) {
                    setIsContextualVisible(false);
                    return null;
                }
                return current;
            });
        };
    }, []);

    const setContextualVisible = useCallback((visible: boolean) => {
        if (visible && !contextualRow) return; // Cannot show if no content
        setIsContextualVisible(visible);
    }, [contextualRow]);

    const rowIndex = isContextualVisible && contextualRow ? 1 : 0;

    return (
        <BottomNavContext.Provider
            value={{
                contextualRow,
                navItems,
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
    const { user } = useAuth();
    const scope: Scope = user?.role === 'artist' ? 'artist' : 'client';

    useEffect(() => {
        // Register into the CURRENT scope at effect time.
        // If scope changes, this effect re-runs (due to scope dependency)
        const unregister = registerRow(scope, id, content);
        return unregister;
    }, [id, content, registerRow, scope]);
}
