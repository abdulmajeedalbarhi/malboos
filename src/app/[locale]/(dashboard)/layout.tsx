import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ background: "var(--color-surface-950)" }}>
            <Sidebar />
            <Header />
            <main
                className="pt-[var(--header-height)] pb-24 lg:pb-0 transition-all duration-300 lg:ms-[var(--sidebar-width)] ms-0"
            >
                <div className="p-4 lg:p-6">{children}</div>
            </main>
            <BottomNav />
        </div>
    );
}
