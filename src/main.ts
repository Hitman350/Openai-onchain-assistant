import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = Number(process.env.BACKEND_PORT ?? 4000);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const frontendOrigin =
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(port, '0.0.0.0');
  console.log(`Dimensity API listening on http://127.0.0.1:${port}/api`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
