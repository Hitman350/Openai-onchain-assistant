import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { ExecuteToolModule } from './execute-tool/execute-tool.module';
import { ConversationsModule } from './conversations/conversations.module';
import { WalletsModule } from './wallets/wallets.module';

/** HTTP API — primary backend for the Next.js frontend (proxied via rewrites). */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'web/.env.local'],
    }),
    PrismaModule,
    ChatModule,
    ExecuteToolModule,
    ConversationsModule,
    WalletsModule,
  ],
})
export class AppModule {}
