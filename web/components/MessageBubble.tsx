"use client";

import type { Message } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Human-readable tool labels
const TOOL_LABELS: Record<string, string> = {
    get_balance: "📊 Checked balance",
    get_wallet_address: "🔑 Looked up wallet address",
    send_transaction: "💸 Send transaction",
    deploy_erc20: "🚀 Deploy ERC-20 token",
    explain_transaction: "🔍 Explained transaction",
    scan_contract: "🛡️ Scanned contract",
    get_token_info: "📋 Fetched token info",
    estimate_gas: "⛽ Estimated gas",
    get_wallet_history: "📜 Fetched transaction history",
    get_eth_price: "💰 Checked ETH price",
};

// Custom markdown components styled for the dark chat theme
const markdownComponents: Components = {
    p: ({ children }) => (
        <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold" style={{ color: "var(--color-accent-light)" }}>
            {children}
        </strong>
    ),
    em: ({ children }) => (
        <em className="italic" style={{ color: "var(--color-text-secondary)" }}>
            {children}
        </em>
    ),
    ul: ({ children }) => (
        <ul className="ml-4 mb-2 last:mb-0 space-y-1 list-none">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="ml-4 mb-2 last:mb-0 space-y-1 list-decimal" style={{ color: "var(--color-text-secondary)" }}>
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="relative pl-4 before:content-['▸'] before:absolute before:left-0 before:text-[var(--color-accent)] before:text-xs before:top-[3px]">
            {children}
        </li>
    ),
    h1: ({ children }) => (
        <h1 className="text-base font-bold mb-2 mt-3 first:mt-0" style={{ color: "var(--color-accent-light)" }}>
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0" style={{ color: "var(--color-accent-light)" }}>
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0" style={{ color: "var(--color-text-primary)" }}>
            {children}
        </h3>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-1 underline-offset-2 transition-colors hover:opacity-80"
            style={{ color: "var(--color-accent-light)" }}
        >
            {children} ↗
        </a>
    ),
    code: ({ className, children, ...props }) => {
        const isInline = !className;
        if (isInline) {
            return (
                <code
                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{
                        background: "var(--color-surface-overlay)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-accent-light)",
                    }}
                    {...props}
                >
                    {children}
                </code>
            );
        }
        return (
            <code
                className={`block p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 ${className || ""}`}
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                }}
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="my-2 rounded-lg overflow-hidden">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote
            className="pl-3 my-2 text-sm italic"
            style={{
                borderLeft: "3px solid var(--color-accent)",
                color: "var(--color-text-secondary)",
            }}
        >
            {children}
        </blockquote>
    ),
    hr: () => (
        <hr className="my-3 border-0 h-px" style={{ background: "var(--color-border)" }} />
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto my-2 rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
            <table className="w-full text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead style={{ background: "var(--color-surface-overlay)" }}>{children}</thead>
    ),
    th: ({ children }) => (
        <th className="px-3 py-2 text-left font-semibold" style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
            {children}
        </td>
    ),
};

export function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex justify-end animate-message-in">
                <div
                    className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm text-sm"
                    style={{
                        background: "var(--color-user-bubble)",
                        border: "1px solid var(--color-user-bubble-border)",
                        color: "var(--color-text-primary)",
                    }}
                >
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 animate-message-in">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ background: "var(--color-accent)", color: "white" }}
            >
                D
            </div>
            <div className="max-w-[80%] space-y-2">

                {/* Text content — rendered as markdown */}
                {message.content && (
                    <div
                        className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                        style={{
                            background: "var(--color-surface-raised)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
