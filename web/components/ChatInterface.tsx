"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { Header } from "./Header";
import ConfirmationModal from "./ConfirmationModal";
import type { Message } from "ai";

// Tool names that require user confirmation before execution
const CONFIRMABLE_TOOLS = ["send_transaction", "deploy_erc20"];

interface ChatInterfaceProps {
    conversationId: string | null;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
    const [initialMessages, setInitialMessages] = useState<Message[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load message history when conversationId changes
    useEffect(() => {
        if (!conversationId) {
            setInitialMessages([]);
            return;
        }

        let cancelled = false;
        setLoadingHistory(true);

        fetch(`/api/conversations/${conversationId}`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const msgs: Message[] = (data.messages ?? []).map(
                    (m: { id: string; role: string; content: string }) => ({
                        id: m.id,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    })
                );
                setInitialMessages(msgs);
            })
            .catch(() => {
                if (!cancelled) setInitialMessages([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingHistory(false);
            });

        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    // Key forces useChat to remount when conversation or initial messages change
    const chatKey = `${conversationId ?? "new"}-${initialMessages.length}`;

    return (
        <ChatInner
            key={chatKey}
            conversationId={conversationId}
            initialMessages={initialMessages}
            loadingHistory={loadingHistory}
        />
    );
}

function ChatInner({
    conversationId,
    initialMessages,
    loadingHistory,
}: {
    conversationId: string | null;
    initialMessages: Message[];
    loadingHistory: boolean;
}) {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        addToolResult,
    } = useChat({
        initialMessages,
        body: { conversationId },
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Auto-focus input when AI finishes responding
    useEffect(() => {
        if (!isLoading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading]);

    // Find pending tool calls that need confirmation
    const pendingToolCall = messages
        .flatMap((m) =>
            (m.toolInvocations ?? []).map((t) => ({
                ...t,
                messageId: m.id,
            }))
        )
        .find(
            (t) =>
                t.state === "call" &&
                CONFIRMABLE_TOOLS.includes(t.toolName) &&
                !("result" in t && t.result !== undefined)
        );

    const handleConfirm = (toolCallId: string, result: string) => {
        addToolResult({ toolCallId, result });
    };

    const handleCancel = (toolCallId: string) => {
        addToolResult({
            toolCallId,
            result: "User cancelled this action.",
        });
    };

    const suggestions = [
        "What is my wallet address?",
        "Check my balance",
        "Deploy an ERC-20 token",
        "Show my recent transactions",
        "What's ETH worth right now?",
        "What's my balance in USD?",
    ];

    return (
        <div className="flex flex-col h-full">
            <Header />

            {/* Chat area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-6"
                style={{ background: "var(--color-surface)" }}
            >
                <div className="max-w-3xl mx-auto space-y-4">
                    {loadingHistory && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {!loadingHistory && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
                            <div
                                className="text-5xl mb-4"
                                style={{ filter: "grayscale(0.2)" }}
                            >
                                ⚡
                            </div>
                            <h2
                                className="text-xl font-semibold mb-2"
                                style={{ color: "var(--color-text-primary)" }}
                            >
                                What can I do for you?
                            </h2>
                            <p
                                className="text-sm max-w-md"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                Send ETH, deploy tokens, scan contracts, check balances — just
                                describe what you need in plain English.
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-6 text-xs">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            const nativeInputValueSetter =
                                                Object.getOwnPropertyDescriptor(
                                                    window.HTMLInputElement.prototype,
                                                    "value"
                                                )?.set;
                                            const el = document.querySelector(
                                                "#chat-input"
                                            ) as HTMLInputElement;
                                            if (el && nativeInputValueSetter) {
                                                nativeInputValueSetter.call(el, suggestion);
                                                el.dispatchEvent(
                                                    new Event("input", { bubbles: true })
                                                );
                                            }
                                        }}
                                        className="px-3 py-2 rounded-lg text-left transition-colors cursor-pointer"
                                        style={{
                                            background: "var(--color-surface-raised)",
                                            border: "1px solid var(--color-border)",
                                            color: "var(--color-text-secondary)",
                                        }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3 animate-message-in">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                                style={{ background: "var(--color-accent)", color: "white" }}
                            >
                                D
                            </div>
                            <div
                                className="px-4 py-3 rounded-xl"
                                style={{ background: "var(--color-surface-raised)" }}
                            >
                                <div className="flex gap-1">
                                    <span className="loading-dot" />
                                    <span className="loading-dot" />
                                    <span className="loading-dot" />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            className="text-sm px-4 py-2 rounded-lg animate-message-in"
                            style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#f87171",
                            }}
                        >
                            Error: {error.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Input area */}
            <div
                className="border-t px-4 py-3"
                style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface-raised)",
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    className="max-w-3xl mx-auto flex items-center gap-2"
                >
                    <input
                        ref={inputRef}
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask Dimensity anything about your wallet..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors placeholder:text-[var(--color-text-secondary)]"
                        style={{
                            background: "var(--color-surface-overlay)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-primary)",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 cursor-pointer"
                        style={{
                            background: `linear-gradient(135deg, var(--color-accent), var(--color-accent-light))`,
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>

            {/* Confirmation Modal — shown when a tool call needs user approval */}
            {pendingToolCall && (
                <ConfirmationModal
                    toolCall={pendingToolCall}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}
