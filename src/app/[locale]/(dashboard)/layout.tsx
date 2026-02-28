import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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
                className="pt-[var(--header-height)] transition-all duration-300 lg:ms-[var(--sidebar-width)] ms-0"
            >
                <div className="p-4 lg:p-6">{children}</div>
            </main>
        </div>
    );
}
