import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';

@Controller('planning')
export class PlanningController {
  constructor(
    private readonly generateDailyPlanUseCase: GenerateDailyPlanUseCase,
    private readonly getDailyPlanUseCase: GetDailyPlanUseCase,
  ) {}

  @Post('generate')
  async generate(@Body() dto: GenerateDailyPlanDto) {
    const result = await this.generateDailyPlanUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      message: 'Daily plan generated successfully',
      plan: result.getValue(), // Should map to DTO in real app
    };
  }

  @Get('today')
  async getToday(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.getDailyPlanUseCase.execute({
      userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      plan: result.getValue(),
    };
  }
}
