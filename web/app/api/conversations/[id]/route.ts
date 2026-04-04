import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
    const session = await auth();
    if (!session?.user) return null;
    return (session.user as Record<string, unknown>).userId as string;
}

// GET /api/conversations/[id] — get messages for a conversation
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
        where: { id, user_id: userId },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
        where: { conversation_id: id },
        select: { id: true, role: true, content: true, created_at: true },
        orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ messages });
}

// DELETE /api/conversations/[id] — delete a conversation
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
        where: { id, user_id: userId },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Cascade delete handles messages
    await prisma.conversation.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
}

// PATCH /api/conversations/[id] — update title
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title } = await req.json();

    const conversation = await prisma.conversation.findFirst({
        where: { id, user_id: userId },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
        where: { id },
        data: { title },
        select: { id: true, title: true, updated_at: true },
    });

    return NextResponse.json(updated);
}
