import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GamificationService } from './application/gamification.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get user stats (XP, Level, Streaks, Gems)' })
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.gamificationService.getUserStats(userId);
    return {
      xp: stats.xp,
      level: stats.level,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      gems: stats.gems ?? 0,
    };
  }

  @Get('streak-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Streak at risk? Can use freeze? (for Streak Rescue modal)' })
  async getStreakStatus(@Request() req: { user: { userId: string } }) {
    return this.gamificationService.getStreakStatus(req.user.userId);
  }

  @Post('use-streak-freeze')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spend 50 gems to preserve streak (Streak Rescue)' })
  async useStreakFreeze(@Request() req: { user: { userId: string } }) {
    return this.gamificationService.useStreakFreeze(req.user.userId);
  }
}
