"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
    const { data: session, status } = useSession();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const handleNewChat = useCallback(async () => {
        try {
            const res = await fetch("/api/conversations", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setActiveConversationId(data.id);
            }
        } catch (err) {
            console.error("Failed to create conversation", err);
        }
    }, []);

    const handleSelectConversation = useCallback((id: string) => {
        setActiveConversationId(id);
    }, []);

    // Loading state
    if (status === "loading") {
        return (
            <main
                className="flex items-center justify-center h-screen"
                style={{ background: "var(--color-surface)" }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Loading...
                    </span>
                </div>
            </main>
        );
    }

    // Unauthenticated — show connect screen
    if (!session) {
        return (
            <main
                className="flex flex-col h-screen"
                style={{ background: "var(--color-surface)" }}
            >
                <ConnectWallet />
            </main>
        );
    }

    // Authenticated — show sidebar + chat
    return (
        <main className="flex h-screen overflow-hidden">
            <Sidebar
                activeId={activeConversationId}
                onSelect={handleSelectConversation}
                onNewChat={handleNewChat}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <ChatInterface conversationId={activeConversationId} />
            </div>
        </main>
    );
}
