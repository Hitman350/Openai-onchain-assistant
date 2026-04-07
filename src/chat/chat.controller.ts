import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(SessionGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Req() req: Request & { userId: string },
    @Res() res: Response,
  ): Promise<void> {
    await this.chatService.handleChatPost(req, res, req.userId);
  }
}
