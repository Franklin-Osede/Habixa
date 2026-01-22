import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { CreateHabitUseCase } from './application/create-habit.use-case';
import { ListHabitsUseCase } from './application/list-habits.use-case';
import { GetHabitUseCase } from './application/get-habit.use-case';
import { UpdateHabitUseCase } from './application/update-habit.use-case';
import { DeleteHabitUseCase } from './application/delete-habit.use-case';
import { CompleteHabitUseCase } from './application/complete-habit.use-case';
import { PrismaHabitRepository } from './infrastructure/repositories/prisma-habit.repository';
import { HabitRepository } from './domain/repositories/habit.repository';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [HabitsController],
  providers: [
    PrismaService,
    CreateHabitUseCase,
    ListHabitsUseCase,
    GetHabitUseCase,
    UpdateHabitUseCase,
    DeleteHabitUseCase,
    CompleteHabitUseCase,
    {
      provide: HabitRepository,
      useClass: PrismaHabitRepository,
    },
  ],
  exports: [HabitRepository, CreateHabitUseCase],
})
export class HabitsModule {}
