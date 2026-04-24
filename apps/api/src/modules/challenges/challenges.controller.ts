import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CreateChallengeUseCase } from './application/create-challenge.use-case';
import { GetActiveChallengeUseCase } from './application/get-active-challenge.use-case';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly createChallengeUseCase: CreateChallengeUseCase,
    private readonly getActiveChallengeUseCase: GetActiveChallengeUseCase,
  ) {}

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active challenge for user' })
  async getActive(@Request() req: { user: { userId: string } }) {
    const result = await this.getActiveChallengeUseCase.execute({
      userId: req.user.userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    const challenge = result.getValue();
    return {
      id: challenge.id.toString(),
      status: challenge.status,
      durationDays: challenge.durationDays,
      currentDay: challenge.currentDay,
      trackId: challenge.trackId,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new challenge (1-30 days)' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() body: { durationDays: number; trackId: string },
  ) {
    const result = await this.createChallengeUseCase.execute({
      userId: req.user.userId,
      durationDays: body.durationDays,
      trackId: body.trackId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    const challenge = result.getValue();
    return {
      message: 'Challenge started',
      challenge: {
        id: challenge.id.toString(),
        status: challenge.status,
        durationDays: challenge.durationDays,
        currentDay: challenge.currentDay,
        trackId: challenge.trackId,
      },
    };
  }
}
