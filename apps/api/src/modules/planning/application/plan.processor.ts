/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../common/prisma.service';
import { OPEN_CLAW_PORT, OpenClawPort } from './ports/openclaw.port';
import { OpenClawRequestDto } from './openclaw/openclaw.dto';
import { createFallbackWeekPlan } from './fallback-plan.factory';
import { PLAN_WEEK_SCHEMA_VERSION, PlanWeekContent } from './plan-week.schema';
import { PlanWeekValidatorService } from './plan-week-validator.service';
import { TdeeService } from './tdee/tdee.service';
import { mapUserToTdeeInput } from './tdee/user-tdee.mapper';

@Processor('planning')
export class PlanProcessor extends WorkerHost {
  private readonly logger = new Logger(PlanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OPEN_CLAW_PORT) private readonly openClawClient: OpenClawPort,
    private readonly planWeekValidator: PlanWeekValidatorService,
    private readonly tdeeService: TdeeService,
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
          difficulty: true,
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

      const tdee = this.tdeeService.calculate(mapUserToTdeeInput(user));

      const payload: OpenClawRequestDto = {
        taskId: 'generate_week_1_plan_v1',
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
            nutritionTargets: {
              targetKcal: tdee.targetKcal,
              proteinG: tdee.macros.proteinG,
              carbsG: tdee.macros.carbsG,
              fatG: tdee.macros.fatG,
            },
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

      let content: PlanWeekContent;
      let validationScore = 100;
      let validationErrors: string[] = [];

      if (useFallback) {
        content = createFallbackWeekPlan(exercises, recipes, {
          targetKcal: tdee.targetKcal,
        });
        validationScore = 80;
        validationErrors = ['Fallback used due to entitlement policy'];
      } else {
        const generated = await this.generateAndValidateWeek(payload, {
          exercises,
          recipes,
          userProfile: {
            equipment: user.equipment,
            experienceLevel: user.experienceLevel,
            allergies: user.allergies,
            dietType: user.userStats?.dietaryPreference,
          },
          targetKcal: tdee.targetKcal,
        });
        content = generated.content;
        validationScore = generated.validationScore;
        validationErrors = generated.validationErrors;
      }

      await this.updateJobStatus(jobId, 'RUNNING', 70);

      await this.prisma.$transaction([
        this.prisma.planWeek.upsert({
          where: {
            lifestylePlanId_weekIndex: {
              lifestylePlanId,
              weekIndex: 1,
            },
          },
          create: {
            lifestylePlanId,
            weekIndex: 1,
            content: content as any,
            schemaVersion: PLAN_WEEK_SCHEMA_VERSION,
            validationScore,
            validationErrors: validationErrors as any,
          },
          update: {
            content: content as any,
            schemaVersion: PLAN_WEEK_SCHEMA_VERSION,
            validationScore,
            validationErrors: validationErrors as any,
          },
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

  private async generateAndValidateWeek(
    payload: OpenClawRequestDto,
    context: {
      exercises: Array<{
        id: string;
        equipment: string | null;
        difficulty: string;
        jointStress: string | null;
      }>;
      recipes: Array<{
        id: string;
        isVegan: boolean;
        isGlutenFree: boolean;
      }>;
      userProfile: {
        equipment: string | null;
        experienceLevel: string | null;
        allergies: string[];
        dietType: string | null | undefined;
      };
      targetKcal: number;
    },
  ): Promise<{
    content: PlanWeekContent;
    validationScore: number;
    validationErrors: string[];
  }> {
    let validationErrors: string[] = [];

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await this.openClawClient.generatePlan({
          ...payload,
          taskId:
            attempt === 1
              ? payload.taskId
              : `${payload.taskId}_repair_validation_errors`,
          context: {
            ...payload.context,
            validationErrors,
          } as any,
        });
        const normalized = this.planWeekValidator.normalizeResponse(response);
        const result = this.planWeekValidator.validate({
          response: normalized,
          exercises: context.exercises,
          recipes: context.recipes,
          userProfile: context.userProfile,
        });

        if (result.ok) {
          return {
            content: result.content,
            validationScore: result.score,
            validationErrors: result.errors,
          };
        }

        validationErrors = result.errors;
      } catch (error: any) {
        validationErrors = [error.message || 'OpenClaw generation failed'];
        break;
      }
    }

    return {
      content: createFallbackWeekPlan(context.exercises, context.recipes, {
        targetKcal: context.targetKcal,
      }),
      validationScore: 70,
      validationErrors: [
        'Fallback used after OpenClaw validation failure',
        ...validationErrors,
      ],
    };
  }
}
