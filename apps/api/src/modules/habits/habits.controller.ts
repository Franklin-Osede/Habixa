import { CreateHabitUseCase } from './application/create-habit.use-case';
import { ListHabitsUseCase } from './application/list-habits.use-case';
import { GetHabitUseCase } from './application/get-habit.use-case';
import { UpdateHabitUseCase } from './application/update-habit.use-case';
import { DeleteHabitUseCase } from './application/delete-habit.use-case';
import { CompleteHabitUseCase } from './application/complete-habit.use-case';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { CreateHabitDto } from './application/dtos/create-habit.dto';
import { UpdateHabitDto } from './application/dtos/update-habit.dto';

@Controller('habits')
export class HabitsController {
  constructor(
    private readonly createHabitUseCase: CreateHabitUseCase,
    private readonly listHabitsUseCase: ListHabitsUseCase,
    private readonly getHabitUseCase: GetHabitUseCase,
    private readonly updateHabitUseCase: UpdateHabitUseCase,
    private readonly deleteHabitUseCase: DeleteHabitUseCase,
    private readonly completeHabitUseCase: CompleteHabitUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req: { user: { userId: string } }) {
    const result = await this.listHabitsUseCase.execute(req.user.userId);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.getHabitUseCase.execute({
      habitId: id,
      userId: req.user.userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/update') // Or PUT ':id'
  async updateHabit(
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.updateHabitUseCase.execute({
      habitId: id,
      userId: req.user.userId,
      data: dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/delete') // Or DELETE ':id'
  async deleteHabit(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.deleteHabitUseCase.execute({
      habitId: id,
      userId: req.user.userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { success: true };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateHabitDto,
    @Request() req: { user: { userId: string } },
  ) {
    // Override userId from JWT
    dto.userId = req.user.userId;
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
