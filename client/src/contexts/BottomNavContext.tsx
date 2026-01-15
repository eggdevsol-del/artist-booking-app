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
    // Current Scope (for debug overlay)
    scope: Scope;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export function BottomNavProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    // Default to 'client' for safety if not authenticated or specified.
    const rawRole = user?.role;
    const scope: Scope = rawRole === 'artist' ? 'artist' : 'client';

    const [registry, setRegistry] = useState<Record<Scope, Record<string, ReactNode>>>({
        artist: {},
        client: {}
    });

    // activeId is global, but resolved against current scope.
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isContextualVisible, setIsContextualVisible] = useState(false);

    // Derived contextual row based on current scope
    // Fallback: If no specific row for this ID in this scope, we show nothing (strict) or default?
    // User request: "If a route/row is missing in the current scope, fall back ONLY to that scope’s defaults".
    // Since we don't have per-scope default rows defined in registry yet (other than main row 0), 
    // and `contextualRow` effectively REPLACES the view or ADDS to it? 
    // Actually, Row 1 is additive. If null, we just show Row 0. 
    // So "fallback" here means "don't show a broken artist row for a client". 
    // Our strict lookup `registry[scope][activeId]` ensures this.
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
                scope,
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
        // Logging for sanity check in dev
        if (process.env.NODE_ENV === 'development') {
            console.log(`[BottomNavRegistry] scope=${scope} route=${id} row=1 (contextual)`);
        }

        // Register into the CURRENT scope at effect time.
        // If scope changes, this effect re-runs (due to scope dependency)
        const unregister = registerRow(scope, id, content);
        return unregister;
    }, [id, content, registerRow, scope]);
}
