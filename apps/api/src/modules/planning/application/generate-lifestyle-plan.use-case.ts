import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../common/prisma.service';

export class GenerateLifestylePlanDto {
  userId!: string;
  deviceId?: string;
  startDate?: string;
  useFallback?: boolean;
}

@Injectable()
export class GenerateLifestylePlanUseCase {
  private readonly logger = new Logger(GenerateLifestylePlanUseCase.name);

  constructor(
    @InjectQueue('planning') private readonly planningQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async execute(request: GenerateLifestylePlanDto) {
    this.logger.log(
      `Enqueueing lifestyle plan generation for user ${request.userId}...`,
    );

    const lifestylePlan = await this.prisma.lifestylePlan.create({
      data: {
        userId: request.userId,
        status: 'PENDING',
        startDate: request.startDate ? new Date(request.startDate) : new Date(),
        source: 'OPENCLAW',
        version: '1.0.0',
      },
    });

    const job = await this.prisma.planJob.create({
      data: {
        userId: request.userId,
        lifestylePlanId: lifestylePlan.id,
        status: 'PENDING',
        progress: 0,
      },
    });

    await this.planningQueue.add('generate-plan', {
      jobId: job.id,
      userId: request.userId,
      lifestylePlanId: lifestylePlan.id,
      useFallback: request.useFallback,
    });

    return { jobId: job.id };
  }
}
