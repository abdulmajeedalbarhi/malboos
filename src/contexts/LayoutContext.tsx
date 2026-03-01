"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type LayoutContextType = {
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;
    isMobile: boolean;
    activeBranchId: string | null;
    setActiveBranchId: (id: string | null) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const pathname = usePathname();

    // Check screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint in tailwind
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

    return (
        <LayoutContext.Provider value={{ isMobileMenuOpen, setMobileMenuOpen, toggleMobileMenu, isMobile, activeBranchId, setActiveBranchId }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error("useLayout must be used within a LayoutProvider");
    }
    return context;
}
