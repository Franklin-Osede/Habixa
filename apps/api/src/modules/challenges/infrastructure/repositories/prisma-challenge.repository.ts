import { Injectable } from '@nestjs/common';
import { IChallengeRepository } from './challenge.repository';
import { Challenge, ChallengeProps } from '../../domain/challenge.entity';
import { PrismaService } from '../../../../common/prisma.service';
import { ChallengeMapper } from '../mappers/challenge.mapper'; // We will need a mapper
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

@Injectable()
export class PrismaChallengeRepository implements IChallengeRepository {
  constructor(private prisma: PrismaService) {}

  async save(challenge: Challenge): Promise<void> {
    // Use UserProgress table to track the user's specific challenge journey
    // We assume a 'Challenge' definition exists separately, or we use a Generic one.
    // For MVP, we might need to find/create a "Custom" challenge row first if FK is required.
    
    // Check if a Generic/Custom Challenge Definition exists
    // If not, we might need a workaround. For now, assuming "UserProgress" requires a challengeId FK.
    // We will handle this in the UseCase or here.
    
    // Simplified Save for UserProgress
    const raw = ChallengeMapper.toPersistence(challenge);
    
    await this.prisma.userProgress.upsert({
        where: { userId_challengeId: { userId: raw.userId, challengeId: raw.challengeId } },
        update: {
            currentDay: raw.currentDay,
            status: raw.status,
            completedAt: raw.status === 'COMPLETED' ? new Date() : null,
        },
        create: {
            userId: raw.userId,
            challengeId: raw.challengeId,
            currentDay: raw.currentDay,
            status: raw.status,
            startedAt: raw.startDate
        }
    });
  }

  async findById(id: string): Promise<Challenge | null> {
    // This is tricky because ID usually refers to UserProgress ID or definitions
    // We'll skip generic ID find for now and focus on findActiveByUserId
    return null;
  }

  async findActiveByUserId(userId: string): Promise<Challenge | null> {
    const progress = await this.prisma.userProgress.findFirst({
        where: { 
            userId, 
            status: 'ACTIVE' // Assuming schema string match
        }
    });

    if (!progress) return null;

    // We also need the duration from the definition
    const challengeDef = await this.prisma.challenge.findUnique({
        where: { id: progress.challengeId }
    });

    if (!challengeDef) return null;

    return Challenge.create({
        userId: new UniqueEntityID(progress.userId),
        trackId: challengeDef.title, // Mapping title to trackId for now
        durationDays: challengeDef.durationDays,
        startDate: progress.startedAt,
        status: progress.status as 'ACTIVE' | 'COMPLETED' | 'FAILED',
        currentDay: progress.currentDay,
        linkedDailyPlanIds: [] // We would fetch PlanDays here if needed
    }, new UniqueEntityID(progress.id)).getValue();
  }
}
