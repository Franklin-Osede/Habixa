/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../common/prisma.service';
import { OPEN_CLAW_PORT, OpenClawPort } from './ports/openclaw.port';
import { OpenClawRequestDto } from './openclaw/openclaw.dto';

@Processor('planning')
export class PlanProcessor extends WorkerHost {
  private readonly logger = new Logger(PlanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OPEN_CLAW_PORT) private readonly openClawClient: OpenClawPort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, userId, lifestylePlanId, useFallback } = job.data;

    await this.updateJobStatus(jobId, 'RUNNING', 10);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userStats: true },
      });

      if (!user) throw new Error(`User ${userId} not found`);

      const exercises = await this.prisma.exercise.findMany({
        select: {
          id: true,
          jointStress: true,
          equipment: true,
          movementPattern: true,
        },
      });
      const recipes = await this.prisma.recipe.findMany({
        select: {
          id: true,
          calories: true,
          protein: true,
          carbs: true,
          fats: true,
          isVegan: true,
          isGlutenFree: true,
        },
      });

      const payload: OpenClawRequestDto = {
        taskId: 'generate_weekly_plan',
        userId: user.id,
        context: {
          userProfile: {
            goals: user.goals || [],
            experienceLevel: user.experienceLevel || 'Beginner',
            injuries: [],
            equipment: user.equipment || 'No Equipment',
          },
          preferences: {
            mealsPerDay: 4,
            allergies: user.allergies || [],
            dietType: user.userStats?.dietaryPreference || 'Omnivore',
          },
          availableCatalog: {
            exercises: exercises.map((ex) => ({
              id: ex.id,
              tags: [ex.movementPattern, ex.equipment, ex.jointStress].filter(
                Boolean,
              ) as string[],
            })),
            recipes: recipes.map((rec) => ({
              id: rec.id,
              macros: {
                kcal: rec.calories,
                p: rec.protein,
                c: rec.carbs,
                f: rec.fats,
              },
              tags: [
                rec.isVegan ? 'Vegan' : '',
                rec.isGlutenFree ? 'GlutenFree' : '',
              ].filter(Boolean),
            })),
          },
        },
      };

      await this.updateJobStatus(jobId, 'RUNNING', 30);

      let response;
      if (useFallback) {
        // Fallback heuristic for FREE users to save OpenClaw costs
        response = {
          plan: Array(7).fill({
            day: 'Fallback Day',
            info: 'Unlock PREMIUM for full AI generated routines.',
          }),
        };
      } else {
        response = await this.openClawClient.generatePlan(payload);
      }

      await this.updateJobStatus(jobId, 'RUNNING', 70);

      // Map response to weeks (assuming response.plan is array of days or similar)
      const baseContent = Array.isArray(response.plan)
        ? response.plan
        : [response.plan];

      // Save 26 weeks for complete 6-month support
      const weeksData = [];
      for (let i = 1; i <= 26; i++) {
        // Segment 7 days per week if we have enough items, else repeat/mock
        const startIndex = (i - 1) * 7;
        const weekChunk = baseContent.slice(startIndex, startIndex + 7);

        if (weekChunk.length === 0) break; // Don't duplicate if OpenClaw didn't generate enough days

        weeksData.push({
          lifestylePlanId,
          weekIndex: i,
          content: weekChunk as any,
        });
      }

      await this.prisma.$transaction([
        this.prisma.planWeek.createMany({
          data: weeksData,
          skipDuplicates: true,
        }),
        this.prisma.lifestylePlan.update({
          where: { id: lifestylePlanId },
          data: { status: 'READY' },
        }),
        this.prisma.planJob.update({
          where: { id: jobId },
          data: { status: 'READY', progress: 100 },
        }),
      ]);
    } catch (error: any) {
      this.logger.error(error);
      await this.prisma.planJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      await this.prisma.lifestylePlan.update({
        where: { id: lifestylePlanId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private async updateJobStatus(id: string, status: string, progress: number) {
    await this.prisma.planJob.update({
      where: { id },
      data: { status, progress },
    });
  }
}
