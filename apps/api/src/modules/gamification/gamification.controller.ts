import { Controller, Get, Param } from '@nestjs/common';
import { GamificationService } from './application/gamification.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get user stats (XP, Level, Streaks)' })
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.gamificationService.getUserStats(userId);
    return {
      xp: stats.xp,
      level: stats.level,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    };
  }
}
