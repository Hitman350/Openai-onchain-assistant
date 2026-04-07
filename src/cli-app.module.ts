import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainModule } from './blockchain/blockchain.module';
import { SignerModule } from './signers/signer.module';
import { ProviderModule } from './providers/provider.module';
import { ContextModule } from './context/context.module';
import { ToolsModule } from './tools/tools.module';
import { AgentModule } from './agent/agent.module';

/** Nest context for the terminal CLI agent (no HTTP server). */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'web/.env.local'],
    }),
    BlockchainModule,
    SignerModule,
    ProviderModule,
    ContextModule,
    ToolsModule,
    AgentModule,
  ],
})
export class CliAppModule {}
