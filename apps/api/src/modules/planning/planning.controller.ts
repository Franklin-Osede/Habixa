import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './application/generate-daily-plan.use-case';

@Controller('planning')
export class PlanningController {
  constructor(
    private readonly generateDailyPlanUseCase: GenerateDailyPlanUseCase,
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
}
