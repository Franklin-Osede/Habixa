/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
  Headers,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LifestyleActivityCompletedEvent } from '../../shared/domain/events/gamification.events';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';
import { GenerateLifestylePlanUseCase } from './application/generate-lifestyle-plan.use-case';
import { PrismaService } from '../../common/prisma.service';
import { openClawWeekResponseSchema } from './application/plan-week.schema';
import {
  LifestyleTodayStatusDto,
  PLAN_STATUS,
  PlanFailedDto,
  PlanGeneratingDto,
  PlanNotStartedDto,
  PlanReadyDto,
} from './application/dto/lifestyle-today-status.dto';
import {
  ShoppingListAggregatorService,
  ShoppingListMealSource,
} from './application/shopping-list/shopping-list-aggregator.service';

@ApiTags('Planning')
@ApiExtraModels(
  PlanNotStartedDto,
  PlanGeneratingDto,
  PlanFailedDto,
  PlanReadyDto,
)
@Controller('planning')
export class PlanningController {
  constructor(
    private readonly generateDailyPlanUseCase: GenerateDailyPlanUseCase,
    private readonly getDailyPlanUseCase: GetDailyPlanUseCase,
    private readonly generateLifestylePlanUseCase: GenerateLifestylePlanUseCase,
    private readonly prisma: PrismaService,
    private readonly shoppingListAggregator: ShoppingListAggregatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('generate')
  async generateDaily(@Body() dto: GenerateDailyPlanDto) {
    const result = await this.generateDailyPlanUseCase.execute(dto);
    if (result.isFailure) throw new BadRequestException(result.error);
    return {
      message: 'Daily plan generated successfully',
      plan: result.getValue(),
    };
  }

  @UseGuards(AuthGuard('jwt'), ThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 86400000 } }) // 2 request max per day
  @Post('lifestyle/generate')
  async generateLifestyle(
    @Body() body: { startDate?: string },
    @Req() req: any,
    @Headers('x-device-id') deviceId: string,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!deviceId)
      throw new BadRequestException('X-Device-Id header is required');
    if (!userId) throw new BadRequestException('User not authenticated');

    // Anti-abuse logic
    let device = await this.prisma.device.findUnique({ where: { deviceId } });
    if (!device) {
      device = await this.prisma.device.create({ data: { deviceId } });
    } else {
      await this.prisma.device.update({
        where: { deviceId },
        data: { lastSeenAt: new Date() },
      });
    }

    await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId },
      update: {},
    });

    const previousEntitlements = await this.prisma.entitlement.findMany({
      where: { deviceId, type: { in: ['TRIAL', 'PREMIUM'] } },
    });

    let useFallback = true;
    if (previousEntitlements.length === 0) {
      // Grant Trial if first time
      await this.prisma.entitlement.create({
        data: {
          userId,
          deviceId,
          type: 'TRIAL',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      useFallback = false;
    } else {
      const active = await this.prisma.entitlement.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
      });
      if (active.some((e) => ['PREMIUM', 'TRIAL'].includes(e.type))) {
        useFallback = false;
      }
    }

    const result = await this.generateLifestylePlanUseCase.execute({
      userId,
      deviceId,
      startDate: body.startDate,
      useFallback,
    });

    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lifestyle/status')
  async getLifestyleStatus(@Query('jobId') jobId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!jobId) throw new BadRequestException('jobId is required');
    const job = await this.prisma.planJob.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== userId)
      throw new BadRequestException('Job not found');
    return {
      status: job.status,
      progress: job.progress,
      lifestylePlanId: job.lifestylePlanId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the user's current lifestyle plan state for today",
    description:
      'Returns a discriminated union: NOT_STARTED | GENERATING | FAILED | READY. ' +
      'Frontends should branch on `status` and never assume a payload shape. ' +
      'Use this endpoint for lightweight state checks (home screen header, polling). ' +
      'For meal cards with full ingredient breakdowns, prefer GET lifestyle/today/detailed.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PlanNotStartedDto) },
        { $ref: getSchemaPath(PlanGeneratingDto) },
        { $ref: getSchemaPath(PlanFailedDto) },
        { $ref: getSchemaPath(PlanReadyDto) },
      ],
      discriminator: {
        propertyName: 'status',
        mapping: {
          NOT_STARTED: getSchemaPath(PlanNotStartedDto),
          GENERATING: getSchemaPath(PlanGeneratingDto),
          FAILED: getSchemaPath(PlanFailedDto),
          READY: getSchemaPath(PlanReadyDto),
        },
      },
    },
  })
  @Get('lifestyle/today')
  async getLifestyleToday(@Req() req: any): Promise<LifestyleTodayStatusDto> {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.resolveLifestyleToday(userId as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get today's plan with hydrated recipes and ingredient quantities",
    description:
      'Same discriminated union as GET lifestyle/today, but for the READY ' +
      'state every meal is hydrated with its full Recipe (title, instructions, ' +
      'macros, image) and a typed ingredient list with grams + unit. ' +
      'Recipes whose IDs no longer exist are returned with `recipe: null` ' +
      'so the UI can flag the inconsistency without breaking the layout.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Discriminated union. NOT_STARTED / GENERATING / FAILED variants ' +
      'are identical to GET lifestyle/today. The READY variant differs in ' +
      'that `day.nutrition.meals[]` contains a hydrated `recipe` object ' +
      '(or null) instead of a bare `recipeId` string.',
  })
  @Get('lifestyle/today/detailed')
  async getLifestyleTodayDetailed(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const status = await this.resolveLifestyleToday(userId as string);
    if (status.status !== PLAN_STATUS.READY) return status;

    return { ...status, day: await this.hydrateDay(status.day) };
  }

  private async resolveLifestyleToday(
    userId: string,
  ): Promise<LifestyleTodayStatusDto> {
    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
    });

    if (!lifestylePlan) {
      return { status: PLAN_STATUS.NOT_STARTED };
    }

    if (
      lifestylePlan.status === 'PENDING' ||
      lifestylePlan.status === 'RUNNING'
    ) {
      const job = await this.prisma.planJob.findFirst({
        where: { lifestylePlanId: lifestylePlan.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: PLAN_STATUS.GENERATING,
        jobId: job?.id ?? null,
        progress: job?.progress ?? 0,
      };
    }

    if (lifestylePlan.status === 'FAILED') {
      const job = await this.prisma.planJob.findFirst({
        where: { lifestylePlanId: lifestylePlan.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: PLAN_STATUS.FAILED,
        errorMessage: job?.errorMessage ?? null,
        canRetry: true,
      };
    }

    // status === 'READY'
    const startDate = new Date(lifestylePlan.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const startMs = startDate.getTime();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const elapsedDays = Math.max(
      0,
      Math.floor((today.getTime() - startMs) / (24 * 60 * 60 * 1000)),
    );
    const weekIndex = Math.floor(elapsedDays / 7) + 1;
    const dayIndex = (elapsedDays % 7) + 1;
    const week =
      lifestylePlan.weeks.find((item) => item.weekIndex === weekIndex) ||
      lifestylePlan.weeks[0];

    if (!week) {
      throw new BadRequestException('Plan week not ready');
    }

    const parsedWeek = openClawWeekResponseSchema.safeParse(week.content);
    if (!parsedWeek.success) {
      throw new BadRequestException('Stored plan has invalid schema');
    }

    const day =
      parsedWeek.data.days.find((item) => item.dayIndex === dayIndex) ||
      parsedWeek.data.days[0];

    const completedTasks = await this.prisma.dailyUserTask.findMany({
      where: { userId, date: today, planWeekId: week.id, isCompleted: true },
      select: {
        activityId: true,
        activityType: true,
        title: true,
        completedAt: true,
      },
    });

    return {
      status: PLAN_STATUS.READY,
      lifestylePlanId: lifestylePlan.id,
      planWeekId: week.id,
      weekIndex: week.weekIndex,
      dayIndex: day.dayIndex,
      date: today.toISOString().split('T')[0],
      source: lifestylePlan.source,
      schemaVersion: week.schemaVersion,
      day: day as unknown as Record<string, unknown>,
      completion: completedTasks as unknown as Array<Record<string, unknown>>,
    };
  }

  /**
   * Replace each `meal.recipeId` and each workout exercise's `exerciseId`
   * with a fully hydrated `recipe` / `exercise` object (catalog row +
   * relations). Missing rows surface as `null` so the UI flags the
   * inconsistency without breaking layout.
   */
  private async hydrateDay(
    day: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const nutrition = day.nutrition as
      | { meals?: Array<{ recipeId?: string; [k: string]: unknown }> }
      | undefined;
    const workout = day.workout as
      | {
          blocks?: Array<{
            exercises?: Array<{ exerciseId?: string; [k: string]: unknown }>;
            [k: string]: unknown;
          }>;
          [k: string]: unknown;
        }
      | undefined;

    const hydratedNutrition = await this.hydrateNutrition(nutrition);
    const hydratedWorkout = await this.hydrateWorkout(workout);

    return {
      ...day,
      nutrition: hydratedNutrition,
      workout: hydratedWorkout,
    };
  }

  private async hydrateNutrition(
    nutrition:
      | { meals?: Array<{ recipeId?: string; [k: string]: unknown }> }
      | undefined,
  ): Promise<Record<string, unknown>> {
    const meals = nutrition?.meals ?? [];
    const recipeIds = Array.from(
      new Set(meals.map((m) => m.recipeId).filter((id): id is string => !!id)),
    );

    const recipes = recipeIds.length
      ? await this.prisma.recipe.findMany({
          where: { id: { in: recipeIds } },
          include: {
            ingredients: { include: { ingredient: true } },
          },
        })
      : [];

    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    const hydratedMeals = meals.map((meal) => {
      const recipe = meal.recipeId ? recipeById.get(meal.recipeId) : undefined;
      const { recipeId: _omit, ...rest } = meal;
      void _omit;
      return {
        ...rest,
        recipe: recipe
          ? {
              id: recipe.id,
              title: recipe.title,
              instructions: recipe.instructions,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fats: recipe.fats,
              imageUrl: recipe.imageUrl,
              prepTimeMin: recipe.prepTimeMin,
              isVegan: recipe.isVegan,
              isGlutenFree: recipe.isGlutenFree,
              ingredients: recipe.ingredients.map((ri) => ({
                quantityGrams: ri.quantityGrams,
                unit: ri.unit,
                notes: ri.notes,
                ingredient: {
                  id: ri.ingredient.id,
                  name: ri.ingredient.name,
                  category: ri.ingredient.category,
                  caloriesPer100g: ri.ingredient.caloriesPer100g,
                  isVegan: ri.ingredient.isVegan,
                },
              })),
            }
          : null,
      };
    });

    return { ...(nutrition ?? {}), meals: hydratedMeals };
  }

  private async hydrateWorkout(
    workout:
      | {
          blocks?: Array<{
            exercises?: Array<{ exerciseId?: string; [k: string]: unknown }>;
            [k: string]: unknown;
          }>;
          [k: string]: unknown;
        }
      | undefined,
  ): Promise<Record<string, unknown> | undefined> {
    if (!workout) return workout;
    const blocks = workout.blocks ?? [];

    const exerciseIds = Array.from(
      new Set(
        blocks
          .flatMap((b) => b.exercises ?? [])
          .map((e) => e.exerciseId)
          .filter((id): id is string => !!id),
      ),
    );

    const exercises = exerciseIds.length
      ? await this.prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
        })
      : [];
    const exerciseById = new Map(exercises.map((e) => [e.id, e]));

    const hydratedBlocks = blocks.map((block) => ({
      ...block,
      exercises: (block.exercises ?? []).map((item) => {
        const exercise = item.exerciseId
          ? exerciseById.get(item.exerciseId)
          : undefined;
        const { exerciseId: _omit, ...rest } = item;
        void _omit;
        return {
          ...rest,
          exercise: exercise
            ? {
                id: exercise.id,
                name: exercise.name,
                description: exercise.description,
                expertCues: exercise.expertCues,
                difficulty: exercise.difficulty,
                muscleGroup: exercise.muscleGroup,
                equipment: exercise.equipment,
                movementPattern: exercise.movementPattern,
                jointStress: exercise.jointStress,
                videoUrl: exercise.videoUrl,
                thumbnailUrl: exercise.thumbnailUrl,
              }
            : null,
        };
      }),
    }));

    return { ...workout, blocks: hydratedBlocks };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aggregated weekly shopping list grouped by ingredient',
    description:
      "Walks the user's current READY lifestyle plan, sums ingredient " +
      'quantities across all 7 days, and returns one entry per ' +
      '(ingredient, unit) pair sorted in canonical shopping order ' +
      '(Protein -> Carb -> Fat -> Veg -> Fruit -> Dairy -> Pantry). ' +
      'Returns 404 when the user has no READY plan. Meals whose recipeId ' +
      'no longer exists are silently skipped.',
  })
  @Get('lifestyle/shopping-list')
  async getShoppingList(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId, status: 'READY' },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
    });

    if (!lifestylePlan) {
      throw new NotFoundException('No READY lifestyle plan');
    }

    const week =
      lifestylePlan.weeks.find((w) => w.weekIndex === 1) ||
      lifestylePlan.weeks[0];
    if (!week) throw new NotFoundException('Plan week not available');

    const parsedWeek = openClawWeekResponseSchema.safeParse(week.content);
    if (!parsedWeek.success) {
      throw new BadRequestException('Stored plan has invalid schema');
    }

    // Collect (recipeId, mealType, dayIndex) tuples across the whole week.
    const tuples: Array<{
      recipeId: string;
      mealType: string;
      dayIndex: number;
    }> = [];
    for (const day of parsedWeek.data.days) {
      for (const meal of day.nutrition?.meals ?? []) {
        if (meal.recipeId) {
          tuples.push({
            recipeId: meal.recipeId,
            mealType: meal.mealType,
            dayIndex: day.dayIndex,
          });
        }
      }
    }

    const recipeIds = Array.from(new Set(tuples.map((t) => t.recipeId)));
    const recipes = recipeIds.length
      ? await this.prisma.recipe.findMany({
          where: { id: { in: recipeIds } },
          include: { ingredients: { include: { ingredient: true } } },
        })
      : [];
    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    const sources: ShoppingListMealSource[] = tuples
      .map((t) => {
        const recipe = recipeById.get(t.recipeId);
        if (!recipe) return null;
        return {
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          mealType: t.mealType,
          dayIndex: t.dayIndex,
          ingredients: recipe.ingredients.map((ri) => ({
            ingredient: {
              id: ri.ingredient.id,
              name: ri.ingredient.name,
              category: ri.ingredient.category,
              caloriesPer100g: ri.ingredient.caloriesPer100g,
              isVegan: ri.ingredient.isVegan,
            },
            quantityGrams: ri.quantityGrams,
            unit: ri.unit,
          })),
        };
      })
      .filter((x): x is ShoppingListMealSource => x !== null);

    const items = this.shoppingListAggregator.aggregate(sources);

    return {
      range: 'week',
      weekIndex: week.weekIndex,
      lifestylePlanId: lifestylePlan.id,
      planWeekId: week.id,
      itemCount: items.length,
      items,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lifestyle/weeks/:weekIndex')
  async getLifestyleWeek(
    @Param('weekIndex', ParseIntPipe) weekIndex: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const entitlements = await this.prisma.entitlement.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    const isPremiumOrTrial = entitlements.some((e) =>
      ['PREMIUM', 'TRIAL'].includes(e.type),
    );

    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { where: { weekIndex } } },
    });

    if (!lifestylePlan || lifestylePlan.weeks.length === 0) {
      throw new BadRequestException('Plan not found or week not ready');
    }

    // Policy: Free can only see week 1.
    if (!isPremiumOrTrial && weekIndex > 1) {
      throw new BadRequestException(
        'Upgrade to premium to access future weeks',
      );
    }

    // Calculate current week from startDate
    const startMs = new Date(lifestylePlan.startDate).getTime();
    const nowMs = Date.now();
    const currentWeek = Math.max(
      1,
      Math.ceil((nowMs - startMs) / (7 * 24 * 60 * 60 * 1000)),
    );

    if (weekIndex > currentWeek + 3) {
      throw new BadRequestException('Cannot access weeks beyond current + 3');
    }

    return { content: lifestylePlan.weeks[0].content };
  }

  @Get('today')
  async getToday(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    const result = await this.getDailyPlanUseCase.execute({ userId });
    if (result.isFailure) throw new BadRequestException(result.error);
    return { plan: result.getValue() };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Skip a planned activity (logs the reason, preserves the streak)',
    description:
      'Records that the user intentionally opted out of an activity. ' +
      'Does NOT count as completed; DOES count as a "freeze day" for the ' +
      'adherence streak. Reason must be one of: illness, time, mood, ' +
      'travel, injury, other. Idempotent on (userId, date, activityId).',
  })
  @Post('lifestyle/activity/skip')
  async skipActivity(
    @Body()
    body: {
      date?: string;
      activityId?: string;
      activityType?: string;
      title?: string;
      planWeekId?: string;
      reason?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    const allowed = ['illness', 'time', 'mood', 'travel', 'injury', 'other'];
    if (!body.reason || !allowed.includes(body.reason)) {
      throw new BadRequestException(
        `reason is required and must be one of: ${allowed.join(', ')}`,
      );
    }

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const normalizedDate = new Date(dateStr);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const activityId = body.activityId || 'lifestyle_activity';
    const title = body.title || 'Lifestyle Activity';

    const task = await this.prisma.dailyUserTask.upsert({
      where: {
        userId_date_activityId: {
          userId,
          date: normalizedDate,
          activityId,
        },
      },
      create: {
        userId,
        title,
        activityId,
        activityType: body.activityType || 'day',
        planWeekId: body.planWeekId,
        isCompleted: false,
        date: normalizedDate,
        skipReason: body.reason,
        skipNotes: body.notes ?? null,
        skippedAt: new Date(),
      },
      update: {
        title,
        activityType: body.activityType || 'day',
        planWeekId: body.planWeekId,
        isCompleted: false,
        completedAt: null,
        skipReason: body.reason,
        skipNotes: body.notes ?? null,
        skippedAt: new Date(),
      },
    });

    return { message: 'Activity skipped', task };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('lifestyle/activity')
  async completeActivity(
    @Body()
    body: {
      date?: string;
      activityId?: string;
      activityType?: string;
      title?: string;
      planWeekId?: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const normalizedDate = new Date(dateStr);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const activityId = body.activityId || 'lifestyle_activity';
    const title = body.title || 'Lifestyle Activity';
    const activityType = body.activityType || 'day';

    const previous = await this.prisma.dailyUserTask.findUnique({
      where: {
        userId_date_activityId: { userId, date: normalizedDate, activityId },
      },
      select: { isCompleted: true },
    });
    const wasAlreadyCompleted = previous?.isCompleted === true;

    const task = await this.prisma.dailyUserTask.upsert({
      where: {
        userId_date_activityId: {
          userId,
          date: normalizedDate,
          activityId,
        },
      },
      create: {
        userId,
        title,
        activityId,
        activityType,
        planWeekId: body.planWeekId,
        isCompleted: true,
        date: normalizedDate,
        completedAt: new Date(),
      },
      update: {
        title,
        activityType,
        planWeekId: body.planWeekId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    if (!wasAlreadyCompleted) {
      this.eventEmitter.emit(
        'lifestyle_activity.completed',
        new LifestyleActivityCompletedEvent(
          userId,
          activityType,
          activityId,
          normalizedDate,
        ),
      );
    }

    const pendingReferral = await this.prisma.referralRedemption.findFirst({
      where: { invitedUserId: userId, status: 'PENDING' },
    });

    if (pendingReferral) {
      // Check distinct active days
      const activeDays = await this.prisma.dailyUserTask.groupBy({
        by: ['date'],
        where: { userId, isCompleted: true },
      });

      if (activeDays.length >= 2) {
        await this.prisma.referralRedemption.update({
          where: { id: pendingReferral.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });

        // Grant 14 days premium to the inviter
        const referralCode = await this.prisma.referralCode.findUnique({
          where: { id: pendingReferral.codeId },
        });
        if (referralCode) {
          await this.prisma.entitlement.create({
            data: {
              userId: referralCode.ownerUserId,
              type: 'PREMIUM',
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
    return { message: 'Activity logged', task };
  }
}
