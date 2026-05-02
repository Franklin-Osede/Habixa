import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { GenerateDailyPlanUseCase } from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';
import { GenerateLifestylePlanUseCase } from './application/generate-lifestyle-plan.use-case';
import { PrismaPlanRepository } from './infrastructure/repositories/prisma-plan.repository';
import { PlanRepository } from './domain/repositories/plan.repository';
import { PrismaService } from '../../common/prisma.service';
import { OPEN_CLAW_PORT } from './application/ports/openclaw.port';
import { OpenClawHttpClient } from './infrastructure/http/openclaw.client';
import { BullModule } from '@nestjs/bullmq';
import { PlanProcessor } from './application/plan.processor';
import { ReferralsController } from './referrals.controller';
import { PlanWeekValidatorService } from './application/plan-week-validator.service';
import { TdeeService } from './application/tdee/tdee.service';
import { ShoppingListAggregatorService } from './application/shopping-list/shopping-list-aggregator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'planning',
    }),
  ],
  controllers: [PlanningController, ReferralsController],
  providers: [
    PrismaService,
    GenerateDailyPlanUseCase,
    GetDailyPlanUseCase,
    GenerateLifestylePlanUseCase,
    {
      provide: PlanRepository,
      useClass: PrismaPlanRepository,
    },
    {
      provide: OPEN_CLAW_PORT,
      useClass: OpenClawHttpClient,
    },
    PlanWeekValidatorService,
    PlanProcessor,
    TdeeService,
    ShoppingListAggregatorService,
  ],
  exports: [
    PlanRepository,
    GenerateDailyPlanUseCase,
    GenerateLifestylePlanUseCase,
  ],
})
export class PlanningModule {}
