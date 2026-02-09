import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { CreateChallengeUseCase } from './application/create-challenge.use-case';
import { PrismaChallengeRepository } from './infrastructure/repositories/prisma-challenge.repository';
import { PrismaService } from '../../common/prisma.service';
import { PlanningModule } from '../planning/planning.module';

@Module({
  imports: [PlanningModule],
  controllers: [ChallengesController],
  providers: [
    PrismaService,
    CreateChallengeUseCase,
    PrismaChallengeRepository,
    // Add Token for Injection if using Interface
    {
        provide: 'IChallengeRepository',
        useClass: PrismaChallengeRepository
    }
  ],
})
export class ChallengesModule {}
