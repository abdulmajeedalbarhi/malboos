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
                className="pt-[var(--header-height)] transition-all duration-300"
                style={{
                    marginInlineStart: "var(--sidebar-width)",
                }}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
