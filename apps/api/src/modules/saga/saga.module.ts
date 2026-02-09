import { Module } from '@nestjs/common';
import { GetSagaPathUseCase } from './application/get-saga-path.use-case';
import { CompleteSagaNodeUseCase } from './application/complete-saga-node.use-case';
import type { GamificationSideEffects } from './application/complete-saga-node.use-case';
import { PrismaSagaPathAdapter } from './infrastructure/prisma-saga-path.adapter';
import { SagaController } from './saga.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { GamificationService } from '../gamification/application/gamification.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  imports: [GamificationModule],
  controllers: [SagaController],
  providers: [
    PrismaService,
    GetSagaPathUseCase,
    CompleteSagaNodeUseCase,
    {
      provide: 'SagaPathPort',
      useClass: PrismaSagaPathAdapter,
    },
    {
      provide: 'GamificationSideEffects',
      useFactory: (gs: GamificationService): GamificationSideEffects => ({
        awardXp: (userId, amount) => gs.awardXp(userId, amount),
        updateStreak: (userId) => gs.updateStreak(userId),
        addGems: (userId, amount) => gs.addGems(userId, amount),
      }),
      inject: [GamificationService],
    },
  ],
  exports: [GetSagaPathUseCase, CompleteSagaNodeUseCase],
})
export class SagaModule {}
