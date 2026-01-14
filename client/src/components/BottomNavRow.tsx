import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface BottomNavRowProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const BottomNavRow = forwardRef<HTMLDivElement, BottomNavRowProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex items-center px-4 py-3 overflow-x-auto gap-2 no-scrollbar scroll-smooth snap-x w-full h-full",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

BottomNavRow.displayName = "BottomNavRow";
