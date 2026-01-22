
import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogWorkoutUseCase, LogWorkoutDto } from './application/log-workout.use-case';
import { GetWorkoutHistoryUseCase } from './application/get-workout-history.use-case';
import { GetWeightStatsUseCase } from './application/get-weight-stats.use-case';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Workouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(
    private readonly logWorkoutUseCase: LogWorkoutUseCase,
    private readonly getHistoryUseCase: GetWorkoutHistoryUseCase,
    private readonly getStatsUseCase: GetWeightStatsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Log a new workout' })
  async logWorkout(@Body() dto: LogWorkoutDto, @Req() req: any) {
    dto.userId = req.user.userId; // Attach user ID from token
    return this.logWorkoutUseCase.execute(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get workout history' })
  async getHistory(@Req() req: any) {
    return this.getHistoryUseCase.execute(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get weight progression stats' })
  async getStats(@Req() req: any, @Query('exercise') exercise: string) {
    if (!exercise) return [];
    return this.getStatsUseCase.execute(req.user.userId, exercise);
  }
}
