import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { Challenge } from '../domain/challenge.entity';
import { IChallengeRepository } from '../infrastructure/repositories/challenge.repository';
import { PrismaService } from '../../../common/prisma.service';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

interface CreateChallengeDto {
  userId: string;
  durationDays: number;
  trackId: string;
}

@Injectable()
export class CreateChallengeUseCase implements UseCase<CreateChallengeDto, Promise<Result<Challenge>>> {
  constructor(
    @Inject('IChallengeRepository') private readonly challengeRepository: IChallengeRepository,
    private readonly prisma: PrismaService, // Direct Prisma access for Transaction & PlanDay
  ) {}

  async execute(request: CreateChallengeDto): Promise<Result<Challenge>> {
    const { userId, durationDays, trackId } = request;

    try {
        // 1. Transactional Creation
        await this.prisma.$transaction(async (tx) => {
            // A. Create/Update UserProgress (The Challenge Wrapper)
            // ideally we find the challenge def first, but we skip for MVP
            
            // Upsert UserProgress
            // We use a dummy challengeId for now if no definition exists, 
            // OR we assume trackId IS the challengeId if the user migrated correctly.
            // For safety, let's create a definition if missing? No, that's too much side effect.
            // We'll trust trackId is valid or just use it.
            
            // Ensure Challenge Definition exists to satisfy FK
            const challengeExists = await tx.challenge.findUnique({ where: { id: trackId } });
            
            if (!challengeExists) {
                await tx.challenge.create({
                    data: {
                        id: trackId,
                        title: 'Generated Challenge',
                        description: 'Auto-generated challenge track',
                        durationDays: durationDays,
                        rewardPoints: 100
                    }
                });
            }

            await tx.userProgress.upsert({
                where: { userId_challengeId: { userId, challengeId: trackId } },
                create: {
                    userId,
                    challengeId: trackId, 
                    status: 'ACTIVE',
                    currentDay: 1,
                    startedAt: new Date(),
                },
                update: {
                    status: 'ACTIVE',
                    currentDay: 1,
                    startedAt: new Date(),
                    completedAt: null
                }
            });

            // B. Generate N Days of PlanDay
            // Delete future plans to avoid collision? 
            // Better to upsert.
            
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < durationDays; i++) {
                const planDate = new Date(startDate);
                planDate.setDate(startDate.getDate() + i);
                
                // MOCK CONTENT GENERATION (The AI Content Engine Skeleton)
                // In Phase 2, this comes from LLM.
                const mockContent = {
                    workout: {
                        icon: 'dumbbell',
                        title: `Day ${i + 1} Workout`,
                        steps: [
                            { name: 'Warmup', reps: '5 min', icon: 'run' },
                            { name: 'Squats', reps: '3x10', icon: 'arrow-down' }
                        ]
                    },
                    meals: {
                        emoji: '🥗',
                        title: 'Healthy Day',
                        details: 'Focus on greens today.'
                    }
                };

                // Create PlanDay (The JSON Table)
                // We use a deterministic ID or lets Prisma generate.
                // We need to check uniqueness on date+user? PlanDay schema doesn't seem to enforce composite unique constraint on User+Date (lines 158-180), 
                // but good practice to check logic.
                
                // We assume one plan per day.
                // We will delete existing plan for that day to be safe/clean
                await tx.planDay.deleteMany({
                    where: { userId, date: planDate }
                });

                await tx.planDay.create({
                    data: {
                        userId,
                        date: planDate,
                        dayIndex: i + 1,
                        phase: 1,
                        generatedWorkout: mockContent.workout, // Storing JSON!
                        generatedMeals: mockContent.meals // Storing JSON!
                    }
                });
            }
        });

        // 2. Return Domain Entity mock
        return Result.ok(Challenge.create({
            userId: new UniqueEntityID(userId),
            durationDays,
            startDate: new Date(),
            status: 'ACTIVE',
            trackId,
            currentDay: 1
        }).getValue());

    } catch (err: any) {
        return Result.fail(`Failed to create challenge: ${err.message}`);
    }
  }
}
