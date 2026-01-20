import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './application/gamification.service';
import { PrismaService } from '../../common/prisma.service';
import { GamificationListeners } from './application/gamification.listeners';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, PrismaService, GamificationListeners],
  exports: [GamificationService],
})
export class GamificationModule {}
