
import { Module } from '@nestjs/common';
import { WorkoutsController } from './workouts.controller';
import { LogWorkoutUseCase } from './application/log-workout.use-case';
import { GetWorkoutHistoryUseCase } from './application/get-workout-history.use-case';
import { GetWeightStatsUseCase } from './application/get-weight-stats.use-case';
import { MockWorkoutRepository } from './infrastructure/mock-workout.repository';
import { WORKOUT_REPOSITORY } from './domain/repositories/workout.repository';

@Module({
  controllers: [WorkoutsController],
  providers: [
    LogWorkoutUseCase,
    GetWorkoutHistoryUseCase,
    GetWeightStatsUseCase,
    {
      provide: WORKOUT_REPOSITORY,
      useClass: MockWorkoutRepository,
    },
  ],
  exports: [],
})
export class WorkoutsModule {}
