import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
    const session = await auth();
    if (!session?.user) return null;
    return (session.user as Record<string, unknown>).userId as string;
}

// GET /api/conversations — list all conversations for the user
export async function GET() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
        where: { user_id: userId },
        select: { id: true, title: true, updated_at: true },
        orderBy: { updated_at: "desc" },
    });

    return NextResponse.json({ conversations });
}

// POST /api/conversations — create a new conversation
export async function POST() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.conversation.create({
        data: { user_id: userId },
        select: { id: true, title: true, updated_at: true },
    });

    return NextResponse.json(conversation);
}
