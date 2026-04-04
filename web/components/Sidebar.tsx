"use client";

import { useState, useEffect } from "react";

type ConversationItem = {
    id: string;
    title: string;
    updated_at: string;
};

interface SidebarProps {
    activeId: string | null;
    onSelect: (id: string) => void;
    onNewChat: () => void;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export function Sidebar({ activeId, onSelect, onNewChat }: SidebarProps) {
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [collapsed, setCollapsed] = useState(false);

    async function fetchConversations() {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            }
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    }

    useEffect(() => {
        fetchConversations();
    }, [activeId]);

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (res.ok) {
                setConversations((prev) => prev.filter((c) => c.id !== id));
                if (activeId === id) {
                    onNewChat();
                }
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
        }
    }

    if (collapsed) {
        return (
            <div
                className="flex flex-col items-center py-3 gap-3 border-r"
                style={{
                    width: "48px",
                    background: "var(--color-surface-raised)",
                    borderColor: "var(--color-border)",
                }}
            >
                <button
                    onClick={() => setCollapsed(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors"
                    style={{
                        background: "var(--color-surface-overlay)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                    }}
                    title="Expand sidebar"
                >
                    ☰
                </button>
                <button
                    onClick={onNewChat}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors"
                    style={{
                        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
                        color: "white",
                    }}
                    title="New chat"
                >
                    +
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col border-r h-full"
            style={{
                width: "260px",
                minWidth: "260px",
                background: "var(--color-surface-raised)",
                borderColor: "var(--color-border)",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-3 border-b"
                style={{ borderColor: "var(--color-border)" }}
            >
                <span
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    Chats
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewChat}
                        className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors"
                        style={{
                            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
                            color: "white",
                        }}
                    >
                        + New
                    </button>
                    <button
                        onClick={() => setCollapsed(true)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs cursor-pointer transition-colors"
                        style={{
                            color: "var(--color-text-secondary)",
                        }}
                        title="Collapse sidebar"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-1">
                {conversations.length === 0 && (
                    <div
                        className="px-3 py-6 text-center text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        No conversations yet.
                        <br />
                        Start a new chat!
                    </div>
                )}

                {conversations.map((convo) => (
                    <button
                        key={convo.id}
                        onClick={() => onSelect(convo.id)}
                        className="w-full group flex items-center gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer"
                        style={{
                            background:
                                convo.id === activeId
                                    ? "var(--color-surface-overlay)"
                                    : "transparent",
                            borderLeft:
                                convo.id === activeId
                                    ? "2px solid var(--color-accent)"
                                    : "2px solid transparent",
                        }}
                    >
                        <div className="flex-1 min-w-0">
                            <div
                                className="text-xs font-medium truncate"
                                style={{
                                    color:
                                        convo.id === activeId
                                            ? "var(--color-text-primary)"
                                            : "var(--color-text-secondary)",
                                }}
                            >
                                {convo.title}
                            </div>
                            <div
                                className="text-[10px] mt-0.5"
                                style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
                            >
                                {timeAgo(convo.updated_at)}
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, convo.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-[10px] transition-opacity cursor-pointer flex-shrink-0"
                            style={{
                                color: "var(--color-text-secondary)",
                            }}
                            title="Delete"
                        >
                            🗑
                        </button>
                    </button>
                ))}
            </div>
        </div>
    );
}
