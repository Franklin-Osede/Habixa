import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('code')
  async getOrCreateCode(@Body() body: { userId: string }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    let code = await this.prisma.referralCode.findFirst({
      where: { ownerUserId: body.userId },
    });
    if (!code) {
      const generatedCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      code = await this.prisma.referralCode.create({
        data: { ownerUserId: body.userId, code: generatedCode },
      });
    }
    return { code: code.code };
  }

  @Post('redeem')
  async redeemCode(
    @Body() body: { userId: string; code: string },
    @Headers('x-device-id') deviceId: string,
  ) {
    if (!deviceId) throw new BadRequestException('X-Device-Id is required');
    if (!body.userId || !body.code)
      throw new BadRequestException('userId and code required');

    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code: body.code },
    });
    if (!referralCode) throw new BadRequestException('Invalid code');
    if (referralCode.ownerUserId === body.userId)
      throw new BadRequestException('Cannot redeem own code');

    // Anti-abuse: 1 redeem per device
    const existingRedemption = await this.prisma.entitlement.findFirst({
      where: { deviceId, type: 'PREMIUM' },
    });
    if (existingRedemption) {
      throw new BadRequestException('This device has already used a referral or premium');
    }
    // This is simplified: in reality we check ReferralRedemption table
    const existingRef = await this.prisma.referralRedemption.findFirst({
      where: { invitedUserId: body.userId },
    });
    if (existingRef)
      throw new BadRequestException('User already redeemed a code');

    const redemption = await this.prisma.referralRedemption.create({
      data: {
        codeId: referralCode.id,
        invitedUserId: body.userId,
        status: 'PENDING',
      },
    });

    // Grant 7 days premium to invitee
    await this.prisma.entitlement.create({
      data: {
        userId: body.userId,
        deviceId,
        type: 'PREMIUM',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      message: 'Code redeemed successfully',
      redemptionId: redemption.id,
    };
  }
}
