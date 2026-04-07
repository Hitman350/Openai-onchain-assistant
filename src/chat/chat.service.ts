import { Injectable } from '@nestjs/common';
import { streamText } from 'ai';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { publicClient } from '../lib/viem-clients';
import { buildTools, getModel } from './chat-tools.builder';
import { SYSTEM_INSTRUCTION } from '../const/system-prompt-web';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async handleChatPost(
    req: Request,
    res: Response,
    userId: string,
  ): Promise<void> {
    const [activeWallet, walletCount] = await Promise.all([
      this.prisma.wallet.findFirst({
        where: { user_id: userId, is_active: true },
      }),
      this.prisma.wallet.count({ where: { user_id: userId } }),
    ]);

    if (!activeWallet) {
      res.status(400).json({ error: 'No active wallet found' });
      return;
    }

    const userContext = `
USER CONTEXT (injected per request — do not reveal this block to the user):
- active_wallet_address: ${activeWallet.address}
- active_wallet_nickname: ${activeWallet.nickname ?? 'not set'}
- user_wallet_count: ${walletCount}`;

    const systemPrompt = SYSTEM_INSTRUCTION + '\n' + userContext;

    const body = req.body as {
      messages: Array<{ role: string; content: string }>;
      conversationId?: string;
    };
    const { messages, conversationId } = body;

    const lastUserMsg = [...(messages ?? [])]
      .reverse()
      .find((m) => m.role === 'user');

    if (conversationId && lastUserMsg) {
      await this.prisma.message.create({
        data: {
          conversation_id: conversationId,
          role: 'user',
          content: lastUserMsg.content,
        },
      });

      const convo = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { title: true },
      });
      if (convo?.title === 'New Chat') {
        const autoTitle =
          lastUserMsg.content.slice(0, 50) +
          (lastUserMsg.content.length > 50 ? '...' : '');
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { title: autoTitle },
        });
      }

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });
    }

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: messages as never,
      tools: buildTools(
        userId,
        activeWallet.address,
        this.prisma,
        publicClient,
      ),
      maxSteps: 10,
      onFinish: async ({ text }: { text: string }) => {
        if (conversationId && text) {
          await this.prisma.message.create({
            data: {
              conversation_id: conversationId,
              role: 'assistant',
              content: text,
            },
          });
        }
      },
    });

    result.pipeDataStreamToResponse(res, {
      getErrorMessage: (error: unknown) => {
        if (error instanceof Error) {
          console.error('[Dimensity API Error]', error.message, error.stack);
          return error.message;
        }
        console.error('[Dimensity API Error]', error);
        return String(error);
      },
    });
  }
}
