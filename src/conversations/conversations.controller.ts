import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('conversations')
@UseGuards(SessionGuard)
export class ConversationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request & { userId: string }) {
    const conversations = await this.prisma.conversation.findMany({
      where: { user_id: req.userId },
      select: { id: true, title: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    });
    return { conversations };
  }

  @Post()
  async create(@Req() req: Request & { userId: string }) {
    return this.prisma.conversation.create({
      data: { user_id: req.userId },
      select: { id: true, title: true, updated_at: true },
    });
  }

  @Get(':id')
  async getOne(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, user_id: req.userId },
    });
    if (!conversation) {
      throw new NotFoundException();
    }
    const messages = await this.prisma.message.findMany({
      where: { conversation_id: id },
      select: { id: true, role: true, content: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
    return { messages };
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, user_id: req.userId },
    });
    if (!conversation) {
      throw new NotFoundException();
    }
    await this.prisma.conversation.delete({ where: { id } });
    return { deleted: true };
  }

  @Patch(':id')
  async patchTitle(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, user_id: req.userId },
    });
    if (!conversation) {
      throw new NotFoundException();
    }
    return this.prisma.conversation.update({
      where: { id },
      data: { title: body.title },
      select: { id: true, title: true, updated_at: true },
    });
  }
}
