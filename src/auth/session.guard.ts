import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getToken } from 'next-auth/jwt';
import type { Request } from 'express';

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not set');
    }

    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]['req'],
      secret,
    });

    if (!token?.userId) {
      throw new UnauthorizedException();
    }

    (req as Request & { userId: string }).userId = token.userId as string;
    return true;
  }
}
