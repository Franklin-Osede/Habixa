import { CreateHabitUseCase } from './application/create-habit.use-case';
import { CompleteHabitUseCase } from './application/complete-habit.use-case';
import {
  Controller,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { CreateHabitDto } from './application/dtos/create-habit.dto';

@Controller('habits')
export class HabitsController {
  constructor(
    private readonly createHabitUseCase: CreateHabitUseCase,
    private readonly completeHabitUseCase: CompleteHabitUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateHabitDto) {
    const result = await this.createHabitUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue(); // Should map to response DTO in real app
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() body: { userId: string; date: string },
  ) {
    const result = await this.completeHabitUseCase.execute({
      habitId: id,
      userId: body.userId,
      date: new Date(body.date),
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }
}
