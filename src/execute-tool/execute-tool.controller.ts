import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { ExecuteToolService } from './execute-tool.service';

@Controller('execute-tool')
@UseGuards(SessionGuard)
export class ExecuteToolController {
  constructor(private readonly executeTool: ExecuteToolService) {}

  @Post()
  async post(
    @Req() req: Request & { userId: string },
    @Body() body: { toolName: string; args: Record<string, string> },
  ) {
    const { toolName, args } = body;
    return this.executeTool.execute(req.userId, toolName, args);
  }
}
