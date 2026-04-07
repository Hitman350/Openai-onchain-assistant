import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { CliAppModule } from './cli-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CliAppModule, {
    logger: ['error', 'warn'],
  });
  app.enableShutdownHooks();
}

bootstrap().catch((error) => {
  console.error(
    'Unhandled error:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exit(1);
});
