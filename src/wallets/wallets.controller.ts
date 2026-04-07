import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SiweMessage } from 'siwe';
import { SessionGuard } from '../auth/session.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('wallets')
@UseGuards(SessionGuard)
export class WalletsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request & { userId: string }) {
    const wallets = await this.prisma.wallet.findMany({
      where: { user_id: req.userId },
      select: {
        address: true,
        nickname: true,
        chain: true,
        is_active: true,
        added_at: true,
      },
      orderBy: { added_at: 'asc' },
    });
    return { wallets };
  }

  @Post()
  async add(
    @Req() req: Request & { userId: string },
    @Body() body: { message: unknown; signature: string },
  ) {
    const { message, signature } = body;
    if (!message || !signature) {
      throw new BadRequestException(
        'SIWE message and signature required to prove wallet ownership',
      );
    }

    const siweMessage = new SiweMessage(message as never);
    const { data: fields } = await siweMessage.verify({ signature });
    const address = fields.address.toLowerCase();

    const existing = await this.prisma.wallet.findUnique({
      where: { user_id_address: { user_id: req.userId, address } },
    });

    if (existing) {
      throw new ConflictException('Wallet already added to your account');
    }

    const wallet = await this.prisma.wallet.create({
      data: {
        user_id: req.userId,
        address,
        nickname: null,
        is_active: false,
      },
    });

    return {
      wallet: {
        address: wallet.address,
        nickname: wallet.nickname,
        chain: wallet.chain,
        is_active: wallet.is_active,
      },
    };
  }

  @Patch(':address')
  async patch(
    @Req() req: Request & { userId: string },
    @Param('address') address: string,
    @Body() body: { nickname?: string; is_active?: boolean },
  ) {
    const normalizedAddress = address.toLowerCase();
    const { nickname, is_active } = body;

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        user_id_address: { user_id: req.userId, address: normalizedAddress },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (is_active === true) {
      await this.prisma.$transaction([
        this.prisma.wallet.updateMany({
          where: { user_id: req.userId },
          data: { is_active: false },
        }),
        this.prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            is_active: true,
            ...(nickname !== undefined ? { nickname } : {}),
          },
        }),
      ]);
    } else if (nickname !== undefined) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { nickname },
      });
    }

    const updated = await this.prisma.wallet.findUnique({
      where: { id: wallet.id },
      select: {
        address: true,
        nickname: true,
        chain: true,
        is_active: true,
      },
    });

    return { wallet: updated };
  }

  @Delete(':address')
  async remove(
    @Req() req: Request & { userId: string },
    @Param('address') address: string,
    @Body() body: { message: unknown; signature: string },
  ) {
    const normalizedAddress = address.toLowerCase();
    const { message, signature } = body;

    if (!message || !signature) {
      throw new BadRequestException(
        'SIWE signature required to prove wallet ownership before deletion',
      );
    }

    const siweMessage = new SiweMessage(message as never);
    const { data: fields } = await siweMessage.verify({ signature });

    if (fields.address.toLowerCase() !== normalizedAddress) {
      throw new ForbiddenException(
        'Signature address does not match wallet being removed',
      );
    }

    const walletCount = await this.prisma.wallet.count({
      where: { user_id: req.userId },
    });

    if (walletCount <= 1) {
      throw new BadRequestException('Cannot remove your last wallet');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        user_id_address: { user_id: req.userId, address: normalizedAddress },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const wasActive = wallet.is_active;

    await this.prisma.wallet.delete({ where: { id: wallet.id } });

    if (wasActive) {
      const firstWallet = await this.prisma.wallet.findFirst({
        where: { user_id: req.userId },
        orderBy: { added_at: 'asc' },
      });
      if (firstWallet) {
        await this.prisma.wallet.update({
          where: { id: firstWallet.id },
          data: { is_active: true },
        });
      }
    }

    return { deleted: normalizedAddress };
  }
}
