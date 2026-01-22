import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { GenerateDailyPlanUseCase } from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';
import { PrismaPlanRepository } from './infrastructure/repositories/prisma-plan.repository';
import { PlanRepository } from './domain/repositories/plan.repository';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [PlanningController],
  providers: [
    PrismaService,
    GenerateDailyPlanUseCase,
    GetDailyPlanUseCase,
    {
      provide: PlanRepository,
      useClass: PrismaPlanRepository,
    },
  ],
  exports: [PlanRepository],
})
export class PlanningModule {}
