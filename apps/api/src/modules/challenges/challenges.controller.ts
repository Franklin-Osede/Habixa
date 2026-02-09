import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { CreateChallengeUseCase } from './application/create-challenge.use-case';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly createChallengeUseCase: CreateChallengeUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new challenge (1-30 days)' })
  async create(@Request() req: any, @Body() body: { durationDays: number; trackId: string }) {
    const result = await this.createChallengeUseCase.execute({
      userId: req.user.userId,
      durationDays: body.durationDays,
      trackId: body.trackId
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { message: 'Challenge started', challenge: result.getValue() }; // Simply return success
  }
}
